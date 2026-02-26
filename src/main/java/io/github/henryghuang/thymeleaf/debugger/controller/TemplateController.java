package io.github.henryghuang.thymeleaf.debugger.controller;

import io.github.henryghuang.thymeleaf.debugger.dto.RenderRequest;
import io.github.henryghuang.thymeleaf.debugger.dto.RenderResponse;
import io.github.henryghuang.thymeleaf.debugger.service.TemplateService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class TemplateController {

    private final TemplateService templateService;

    public TemplateController(TemplateService templateService) {
        this.templateService = templateService;
    }

    @PostMapping("/render")
    public RenderResponse render(@RequestBody RenderRequest request) {
        return templateService.render(request.getTemplate(), request.getData());
    }
}
