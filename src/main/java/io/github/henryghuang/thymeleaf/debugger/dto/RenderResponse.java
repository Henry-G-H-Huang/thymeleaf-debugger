package io.github.henryghuang.thymeleaf.debugger.dto;

import java.util.List;

public class RenderResponse {

    private boolean success;
    private String output;
    private List<ErrorInfo> errors;

    public RenderResponse() {
    }

    public static RenderResponse ok(String output) {
        RenderResponse resp = new RenderResponse();
        resp.success = true;
        resp.output = output;
        return resp;
    }

    public static RenderResponse fail(List<ErrorInfo> errors) {
        RenderResponse resp = new RenderResponse();
        resp.success = false;
        resp.errors = errors;
        return resp;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getOutput() {
        return output;
    }

    public void setOutput(String output) {
        this.output = output;
    }

    public List<ErrorInfo> getErrors() {
        return errors;
    }

    public void setErrors(List<ErrorInfo> errors) {
        this.errors = errors;
    }

    public static class ErrorInfo {

        private Integer line;
        private Integer col;
        private String message;
        private String errorType;

        public ErrorInfo() {
        }

        public ErrorInfo(Integer line, Integer col, String message, String errorType) {
            this.line = line;
            this.col = col;
            this.message = message;
            this.errorType = errorType;
        }

        public Integer getLine() {
            return line;
        }

        public void setLine(Integer line) {
            this.line = line;
        }

        public Integer getCol() {
            return col;
        }

        public void setCol(Integer col) {
            this.col = col;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getErrorType() {
            return errorType;
        }

        public void setErrorType(String errorType) {
            this.errorType = errorType;
        }
    }
}
