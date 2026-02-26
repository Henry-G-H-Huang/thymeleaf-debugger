package io.github.henryghuang.thymeleaf.debugger.dto;

public class RenderRequest {

    private String template;
    private String data;

    public RenderRequest() {
    }

    public RenderRequest(String template, String data) {
        this.template = template;
        this.data = data;
    }

    public String getTemplate() {
        return template;
    }

    public void setTemplate(String template) {
        this.template = template;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
