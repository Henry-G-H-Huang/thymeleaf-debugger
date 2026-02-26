package io.github.henryghuang.thymeleaf.debugger.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.henryghuang.thymeleaf.debugger.dto.RenderResponse;
import io.github.henryghuang.thymeleaf.debugger.dto.RenderResponse.ErrorInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.thymeleaf.exceptions.TemplateInputException;
import org.thymeleaf.exceptions.TemplateProcessingException;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class TemplateService {

    private static final Logger log = LoggerFactory.getLogger(TemplateService.class);

    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    public TemplateService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);

        this.templateEngine = new TemplateEngine();
        this.templateEngine.setTemplateResolver(resolver);
    }

    public RenderResponse render(String template, String jsonData) {
        // Parse JSON context
        Map<String, Object> contextData;
        try {
            contextData = objectMapper.readValue(jsonData, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            log.debug("JSON parse error: {}", e.getMessage());
            Integer jsonLine = e.getLocation() != null ? e.getLocation().getLineNr() : null;
            Integer jsonCol = e.getLocation() != null ? e.getLocation().getColumnNr() : null;
            ErrorInfo error = new ErrorInfo(jsonLine, jsonCol,
                    "JSON解析错误: " + e.getOriginalMessage(), "JSON_ERROR");
            return RenderResponse.fail(List.of(error));
        }

        // Process Thymeleaf template
        try {
            Context context = new Context();
            context.setVariables(contextData);
            String result = templateEngine.process(template, context);
            return RenderResponse.ok(result);
        } catch (TemplateProcessingException e) {
            log.debug("Template processing error: {}", e.getMessage());
            List<ErrorInfo> errors = extractErrors(e);
            return RenderResponse.fail(errors);
        } catch (Exception e) {
            log.debug("Unexpected error: {}", e.getMessage());
            ErrorInfo error = new ErrorInfo(null, null,
                    "未知错误: " + e.getMessage(), "UNKNOWN_ERROR");
            return RenderResponse.fail(List.of(error));
        }
    }

    private List<ErrorInfo> extractErrors(TemplateProcessingException e) {
        List<ErrorInfo> errors = new ArrayList<>();
        Throwable current = e;

        while (current != null) {
            if (current instanceof TemplateProcessingException tpe) {
                String errorType;
                if (current instanceof TemplateInputException) {
                    errorType = "SYNTAX_ERROR";
                } else {
                    errorType = "PROCESSING_ERROR";
                }

                String message = tpe.getMessage();
                // Clean up the message - remove the template name / line info suffix
                // Thymeleaf appends "(template: "xxx" - line N, col N)" to the message
                if (message != null) {
                    int parenIdx = message.lastIndexOf(" (template:");
                    if (parenIdx > 0) {
                        message = message.substring(0, parenIdx);
                    }
                }

                errors.add(new ErrorInfo(
                        tpe.getLine(),
                        tpe.getCol(),
                        message,
                        errorType
                ));
            }

            current = current.getCause();
            // Prevent infinite loops in cause chains
            if (current == e) {
                break;
            }
        }

        // If we somehow got no errors from the chain, add the root exception
        if (errors.isEmpty()) {
            errors.add(new ErrorInfo(null, null, e.getMessage(), "PROCESSING_ERROR"));
        }

        return errors;
    }
}
