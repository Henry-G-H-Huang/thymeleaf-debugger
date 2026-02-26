import { EditorView, basicSetup } from "codemirror";
import { EditorState, StateField, StateEffect } from "@codemirror/state";
import { html } from "@codemirror/lang-html";
import { json } from "@codemirror/lang-json";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap, Decoration } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import jsBeautify from "js-beautify";

// --- Constants & Defaults ---
const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title th:text="\${title}">Default Title</title>
    <style>
        body { font-family: sans-serif; padding: 20px; background: #f0f0f0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        ul { list-style-type: none; padding: 0; }
        li { padding: 8px 0; border-bottom: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="card">
        <h1 th:text="\${title}">Static Title</h1>
        <p>Welcome to the Thymeleaf Debugger!</p>
        
        <h3>Items:</h3>
        <ul>
            <li th:each="item : \${items}">
                <span th:text="\${item}">Item Name</span>
            </li>
        </ul>
    </div>
</body>
</html>`;

const DEFAULT_JSON = `{
  "title": "Hello Thymeleaf!",
  "items": [
    "Apple",
    "Banana",
    "Cherry",
    "Date",
    "Elderberry"
  ]
}`;

// --- State Effects for Error Highlighting ---
const addErrorLine = StateEffect.define();
const clearErrorLines = StateEffect.define();

const errorLineField = StateField.define({
    create() { return Decoration.none; },
    update(lines, tr) {
        lines = lines.map(tr.changes);
        for (let e of tr.effects) {
            if (e.is(addErrorLine)) {
                lines = lines.update({ add: [e.value] });
            } else if (e.is(clearErrorLines)) {
                lines = Decoration.none;
            }
        }
        return lines;
    },
    provide: f => EditorView.decorations.from(f)
});

const errorLineDecoration = Decoration.line({ class: "cm-error-line" });

// --- Editor Initialization ---

let templateEditor, jsonEditor;

function initEditors() {
    // Template Editor (HTML)
    templateEditor = new EditorView({
        doc: DEFAULT_TEMPLATE,
        extensions: [
            basicSetup,
            html(),
            oneDark,
            errorLineField,
            keymap.of([
                ...defaultKeymap,
                { key: "Ctrl-Enter", run: () => { renderTemplate(); return true; } },
                { key: "Shift-Alt-f", run: () => { formatHTML(); return true; } }
            ])
        ],
        parent: document.getElementById("editor-template")
    });

    // JSON Editor
    jsonEditor = new EditorView({
        doc: DEFAULT_JSON,
        extensions: [
            basicSetup,
            json(),
            oneDark,
            keymap.of([
                ...defaultKeymap,
                { key: "Ctrl-Enter", run: () => { renderTemplate(); return true; } },
                { key: "Shift-Alt-f", run: () => { formatJSON(); return true; } }
            ])
        ],
        parent: document.getElementById("editor-json")
    });
}

// --- Layout Resizing Logic ---
function initResizers() {
    // Vertical Resizer (Between Template and JSON)
    const resizerV = document.querySelector('.resizer-vertical');
    const editorsContainer = document.querySelector('.editors-container');
    const leftPanel = document.getElementById('panel-template');
    const rightPanel = document.getElementById('panel-data');

    let isResizingV = false;

    resizerV.addEventListener('mousedown', (e) => {
        isResizingV = true;
        document.body.style.cursor = 'col-resize';
        resizerV.classList.add('active');
    });

    // Horizontal Resizer (Between Editors and Output)
    const resizerH = document.querySelector('.resizer-horizontal');
    const workspace = document.querySelector('.workspace');
    const topSection = document.querySelector('.editors-container');
    const bottomSection = document.getElementById('panel-output');

    let isResizingH = false;

    resizerH.addEventListener('mousedown', (e) => {
        isResizingH = true;
        document.body.style.cursor = 'row-resize';
        resizerH.classList.add('active');
    });

    document.addEventListener('mousemove', (e) => {
        if (isResizingV) {
            const containerRect = editorsContainer.getBoundingClientRect();
            // Calculate percentage
            const newFlexBasis = ((e.clientX - containerRect.left) / containerRect.width) * 100;
            if (newFlexBasis > 10 && newFlexBasis < 90) {
                leftPanel.style.flex = `0 0 ${newFlexBasis}%`;
                rightPanel.style.flex = `1 1 ${100 - newFlexBasis}%`; // ensure right panel takes remaining space
            }
        }

        if (isResizingH) {
            const workspaceRect = workspace.getBoundingClientRect();
            const newHeight = e.clientY - workspaceRect.top;
             // Use pixels for top height, flex for bottom
            if (newHeight > 100 && newHeight < workspaceRect.height - 100) {
                topSection.style.height = `${newHeight}px`;
                topSection.style.flex = 'none'; // Disable flex grow/shrink for precise pixel height
                bottomSection.style.flex = '1';
            }
        }
    });

    document.addEventListener('mouseup', () => {
        if (isResizingV || isResizingH) {
            isResizingV = false;
            isResizingH = false;
            document.body.style.cursor = '';
            resizerV.classList.remove('active');
            resizerH.classList.remove('active');
        }
    });
}


// --- Formatting & Toast Logic ---

function formatJSON() {
    const content = jsonEditor.state.doc.toString();
    try {
        const parsed = JSON.parse(content);
        const formatted = JSON.stringify(parsed, null, 2);
        jsonEditor.dispatch({
            changes: { from: 0, to: jsonEditor.state.doc.length, insert: formatted }
        });
        flashButton('btn-format-json', 'success');
    } catch (e) {
        showToast(`JSON 格式错误: ${e.message}`, 'error');
        flashButton('btn-format-json', 'error');
    }
}

function formatHTML() {
    const content = templateEditor.state.doc.toString();
    try {
        const formatted = jsBeautify.html(content, {
            indent_size: 4,
            indent_char: ' ',
            max_preserve_newlines: 2,
            preserve_newlines: true,
            indent_inner_html: true,
            extra_liners: [],
            wrap_line_length: 120,
            wrap_attributes: 'auto',
            unformatted: ['code', 'pre']
        });
        templateEditor.dispatch({
            changes: { from: 0, to: templateEditor.state.doc.length, insert: formatted }
        });
        flashButton('btn-format-html', 'success');
    } catch (e) {
        showToast(`HTML 格式化失败: ${e.message}`, 'error');
        flashButton('btn-format-html', 'error');
    }
}

function flashButton(btnId, type) {
    const btn = document.getElementById(btnId);
    btn.classList.add(type);
    setTimeout(() => btn.classList.remove(type), 1000);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}


// --- Logic: Render & UI Actions ---

async function renderTemplate() {
    const btnRender = document.getElementById('btn-render');
    const loadingOverlay = document.getElementById('loading-overlay');
    const outputStatus = document.getElementById('output-status');
    const outputPreview = document.getElementById('output-preview');
    const outputSource = document.getElementById('output-source');
    const outputErrors = document.getElementById('output-errors');
    const previewFrame = document.getElementById('preview-frame');
    const sourceCode = document.getElementById('source-code');

    // UI Loading State
    loadingOverlay.classList.remove('hidden');
    btnRender.disabled = true;
    outputStatus.textContent = 'Rendering...';
    outputStatus.style.color = '#ffb86c'; // Orange

    // Clear previous errors
    clearErrors();

    // Prepare Payload
    const payload = {
        template: templateEditor.state.doc.toString(),
        data: jsonEditor.state.doc.toString()
    };

    try {
        const response = await fetch('/api/render', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();

        // Simulate a small delay for smoother UI feel if response is too fast
        // await new Promise(r => setTimeout(r, 300));

        if (result.success) {
            // Success Case
            outputStatus.textContent = 'Success';
            outputStatus.style.color = '#50fa7b'; // Green
            
            // Update Preview
            const blob = new Blob([result.output], { type: 'text/html' });
            previewFrame.src = URL.createObjectURL(blob);
            
            // Update Source
            sourceCode.textContent = result.output;
            
            // Show content view (hide errors)
            outputErrors.style.display = 'none';
            if (document.getElementById('btn-view-preview').classList.contains('active')) {
                outputPreview.style.display = 'block';
                outputSource.style.display = 'none';
            } else {
                outputPreview.style.display = 'none';
                outputSource.style.display = 'block';
            }

        } else {
            // Error Case
            outputStatus.textContent = 'Failed';
            outputStatus.style.color = '#ff5555'; // Red

            outputPreview.style.display = 'none';
            outputSource.style.display = 'none';
            outputErrors.style.display = 'block';

            renderErrorList(result.errors || []);
        }

    } catch (err) {
        // Network/System Error
        outputStatus.textContent = 'System Error';
        outputStatus.style.color = '#ff5555';
        
        outputPreview.style.display = 'none';
        outputSource.style.display = 'none';
        outputErrors.style.display = 'block';
        
        outputErrors.innerHTML = `<div class="error-item">
            <span class="error-badge">SYSTEM</span>
            <div class="error-content">
                <div class="error-message">${err.message}</div>
                <div class="error-type">Network/Client Error</div>
            </div>
        </div>`;
    } finally {
        loadingOverlay.classList.add('hidden');
        btnRender.disabled = false;
    }
}

function clearErrors() {
    // Clear editor highlights
    templateEditor.dispatch({
        effects: clearErrorLines.of(null)
    });
    
    // Clear error list
    document.getElementById('output-errors').innerHTML = '';
}

function renderErrorList(errors) {
    const container = document.getElementById('output-errors');
    container.innerHTML = '';

    if (!errors || errors.length === 0) {
        container.innerHTML = '<div class="error-item">Unknown error occurred</div>';
        return;
    }

    errors.forEach(err => {
        const el = document.createElement('div');
        el.className = 'error-item';
        el.innerHTML = `
            <span class="error-badge">LINE ${err.line || '?'}</span>
            <div class="error-content">
                <div class="error-message">${escapeHtml(err.message)}</div>
                <div class="error-type">${err.errorType || 'Template Error'}</div>
            </div>
        `;
        
        // Click to jump logic
        el.addEventListener('click', () => {
            if (err.line) {
                jumpToError(err.line);
            }
        });

        container.appendChild(el);

        // Highlight line in editor
        if (err.line) {
            const lineInfo = templateEditor.state.doc.line(err.line);
            templateEditor.dispatch({
                effects: addErrorLine.of(errorLineDecoration.range(lineInfo.from))
            });
        }
    });
}

function jumpToError(lineNo) {
    // CodeMirror lines are 1-based, but `line()` handles that.
    // However, validation must ensure line exists.
    const docLines = templateEditor.state.doc.lines;
    if (lineNo > docLines) lineNo = docLines;
    if (lineNo < 1) lineNo = 1;

    const line = templateEditor.state.doc.line(lineNo);
    
    templateEditor.dispatch({
        selection: { anchor: line.from },
        scrollIntoView: true
    });
    templateEditor.focus();
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initEditors();
    initResizers();

    // Event Listeners
    document.getElementById('btn-format-json').addEventListener('click', formatJSON);
    document.getElementById('btn-format-html').addEventListener('click', formatHTML);
    document.getElementById('btn-render').addEventListener('click', renderTemplate);
    
    document.getElementById('btn-clear').addEventListener('click', () => {
        clearErrors();
        document.getElementById('preview-frame').src = 'about:blank';
        document.getElementById('source-code').textContent = '';
        document.getElementById('output-status').textContent = 'Ready';
        document.getElementById('output-status').style.color = 'inherit';
    });

    // View Toggles
    const btnPreview = document.getElementById('btn-view-preview');
    const btnSource = document.getElementById('btn-view-source');
    
    btnPreview.addEventListener('click', () => {
        btnPreview.classList.add('active');
        btnSource.classList.remove('active');
        
        const outputErrors = document.getElementById('output-errors');
        if (outputErrors.style.display !== 'block') { // Only switch if not in error mode
            document.getElementById('output-preview').style.display = 'block';
            document.getElementById('output-source').style.display = 'none';
        }
    });

    btnSource.addEventListener('click', () => {
        btnSource.classList.add('active');
        btnPreview.classList.remove('active');
        
        const outputErrors = document.getElementById('output-errors');
        if (outputErrors.style.display !== 'block') { // Only switch if not in error mode
            document.getElementById('output-source').style.display = 'block';
            document.getElementById('output-preview').style.display = 'none';
        }
    });
});
