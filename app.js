// --- 1. CONFIG ---
const pickerOptions = { types: [{ description: 'Code & Text', accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] } }] };
let currentFontSize = 14;
let clipboardHistory = [];
let openFiles = []; 
let activeFileId = null;
const supportsFileSystem = 'showOpenFilePicker' in window;

// --- 2. DOM ELEMENTS ---
const fileNameDisplay = document.getElementById('fileName');
const fileModeDisplay = document.getElementById('fileMode');
const statsDisplay = document.getElementById('stats');
const cursorPosDisplay = document.getElementById('cursorPos'); 
const dropZone = document.getElementById('dropZone');
const languageSelect = document.getElementById('languageSelect');
const tabBar = document.getElementById('tabBar');
const mainToolbar = document.getElementById('mainToolbar');
const brandButton = document.getElementById('brandButton');
const historyMenu = document.getElementById('historyMenu');
const appName = document.getElementById('appName');
const fileInput = document.getElementById('fileInput');

// BUTTONS
const btnNewFile = document.getElementById('btnNewFile');
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnSaveMenu = document.getElementById('btnSaveMenu');
const saveDropdown = document.getElementById('saveDropdown');
const btnSaveAs = document.getElementById('btnSaveAs');
const btnNewTab = document.getElementById('btnNewTab');
const btnTheme = document.getElementById('btnTheme');
const btnPreview = document.getElementById('btnPreview'); 
const btnFind = document.getElementById('btnFind'); 
const btnReplaceAll = document.getElementById('btnReplaceAll'); 
const btnCopy = document.getElementById('btnCopy');
const btnPaste = document.getElementById('btnPaste');
const btnHistory = document.getElementById('btnHistory');
const btnTools = document.getElementById('btnTools');
const toolsMenu = document.getElementById('toolsMenu');

// Tools Menu Items
const toolSort = document.getElementById('toolSort');
const toolTrim = document.getElementById('toolTrim');
const toolDup = document.getElementById('toolDup');
const toolUpper = document.getElementById('toolUpper');
const toolLower = document.getElementById('toolLower');
const toolWrap = document.getElementById('toolWrap');     
const toolZoomIn = document.getElementById('toolZoomIn'); 
const toolZoomOut = document.getElementById('toolZoomOut'); 

const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');
const previewPane = document.getElementById('previewPane');

// --- 3. INITIALIZE CODEMIRROR ---
const cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    theme: 'darcula',
    mode: 'text/plain',
    lineWrapping: true,
    matchBrackets: true,
    indentUnit: 4,
    foldGutter: true,
    gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
    autoCloseBrackets: true,
    autoCloseTags: true,
    styleActiveLine: true,
    highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true },
    hintOptions: { completeSingle: false },
    extraKeys: {
        "Tab": (cm) => cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("    ", "end"),
        "Ctrl-Space": "autocomplete",
        "Ctrl-D": () => duplicateLine(),
        "Ctrl-Shift-Up": () => moveLineUp(),
        "Ctrl-Shift-Down": () => moveLineDown()
    }
});

if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    cm.setOption('theme', 'default');
    btnTheme.textContent = '🌙';
}

// --- 4. OPERATIONS ---
function duplicateLine() {
    const doc = cm.getDoc(); const cursor = doc.getCursor(); const line = doc.getLine(cursor.line);
    doc.replaceRange(line + "\n", {line: cursor.line + 1, ch: 0});
}
function moveLineUp() {
    const doc = cm.getDoc(); const cursor = doc.getCursor(); if (cursor.line === 0) return;
    const line = doc.getLine(cursor.line); const prevLine = doc.getLine(cursor.line - 1);
    doc.replaceRange(line, {line: cursor.line - 1, ch: 0}, {line: cursor.line - 1, ch: prevLine.length});
    doc.replaceRange(prevLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
    cm.setCursor(cursor.line - 1, cursor.ch);
}
function moveLineDown() {
    const doc = cm.getDoc(); const cursor = doc.getCursor(); if (cursor.line === doc.lastLine()) return;
    const line = doc.getLine(cursor.line); const nextLine = doc.getLine(cursor.line + 1);
    doc.replaceRange(nextLine, {line: cursor.line, ch: 0}, {line: cursor.line, ch: line.length});
    doc.replaceRange(line, {line: cursor.line + 1, ch: 0}, {line: cursor.line + 1, ch: nextLine.length});
    cm.setCursor(cursor.line + 1, cursor.ch);
}
function sortLines() {
    const selections = cm.getSelections();
    if (selections.length > 0 && selections[0] !== "") {
        const from = cm.getCursor("from"); const to = cm.getCursor("to");
        const text = cm.getRange({line: from.line, ch: 0}, {line: to.line, ch: 999999});
        const lines = text.split('\n'); lines.sort((a, b) => a.localeCompare(b));
        cm.replaceRange(lines.join('\n'), {line: from.line, ch: 0}, {line: to.line, ch: 999999});
    } else {
        const text = cm.getValue(); const lines = text.split('\n'); lines.sort((a, b) => a.localeCompare(b)); cm.setValue(lines.join('\n'));
    }
}
function trimWhitespace() {
    const doc = cm.getDoc(); const cursor = doc.getCursor();
    cm.eachLine(line => {
        const trimmed = line.text.trimRight();
        if (trimmed !== line.text) { const lineNo = doc.getLineNumber(line); doc.replaceRange(trimmed, {line: lineNo, ch: 0}, {line: lineNo, ch: line.text.length}); }
    });
    cm.setCursor(cursor);
}
function changeCase(type) {
    const selection = cm.getSelection();
    if (selection) { const newText = type === 'upper' ? selection.toUpperCase() : selection.toLowerCase(); cm.replaceSelection(newText); }
}

// --- 5. HELPERS & TABS ---
function detectMode(name) {
    if (!name) return 'text/plain';
    const ext = name.split('.').pop().toLowerCase();
    if (['html', 'htm'].includes(ext)) return 'text/html';
    if (['css', 'scss'].includes(ext)) return 'text/css';
    if (['js', 'jsx', 'ts'].includes(ext)) return 'text/javascript';
    if (ext === 'php') return 'application/x-httpd-php';
    if (ext === 'json') return 'application/json';
    if (ext === 'md') return 'text/x-markdown';
    return 'text/plain';
}

function updateMarkdownPreview() {
    if (previewPane.classList.contains('active')) {
        const file = openFiles.find(f => f.id === activeFileId);
        if (file && file.mode === 'text/x-markdown' && typeof marked !== 'undefined') {
            previewPane.innerHTML = marked.parse(cm.getValue());
        }
    }
}

function renderTabs() {
    tabBar.innerHTML = '';
    openFiles.forEach((file, index) => {
        const tab = document.createElement('div');
        tab.className = `tab ${file.id === activeFileId ? 'active' : ''}`;
        tab.setAttribute('draggable', 'true');
        
        tab.ondragstart = (e) => { e.dataTransfer.setData('text/plain', index); tab.classList.add('dragging'); };
        tab.ondragover = (e) => e.preventDefault();
        tab.ondrop = (e) => {
            e.preventDefault();
            const fromIdx = e.dataTransfer.getData('text/plain');
            const moved = openFiles.splice(fromIdx, 1)[0];
            openFiles.splice(index, 0, moved);
            renderTabs(); saveSession();
        };

        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name'; nameSpan.textContent = file.name;
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close'; closeBtn.textContent = '✕';
        closeBtn.onclick = (e) => { e.stopPropagation(); closeTab(file.id); };
        tab.onclick = () => switchToTab(file.id);
        tab.appendChild(nameSpan);
        if (file.isDirty) { const d = document.createElement('span'); d.className = 'tab-dirty'; d.textContent = '*'; tab.appendChild(d); }
        tab.appendChild(closeBtn);
        tabBar.appendChild(tab);
    });
}

function switchToTab(id) {
    if (activeFileId) {
        const oldFile = openFiles.find(f => f.id === activeFileId);
        if (oldFile) { oldFile.content = cm.getValue(); oldFile.history = cm.getHistory(); oldFile.cursor = cm.getCursor(); }
    }
    activeFileId = id;
    const newFile = openFiles.find(f => f.id === id);
    if (newFile) {
        cm.setValue(newFile.content);
        cm.setOption('mode', newFile.mode);
        cm.setHistory(newFile.history || { done: [], undone: [] });
        if (newFile.cursor) cm.setCursor(newFile.cursor);
        languageSelect.value = newFile.mode === 'text/plain' ? "" : newFile.mode;
        fileModeDisplay.textContent = `(${newFile.mode})`;
        btnPreview.style.display = newFile.mode === 'text/x-markdown' ? 'inline-block' : 'none';
        updateMarkdownPreview();
    }
    renderTabs(); saveSession();
}

function createNewTab(name = "Untitled", content = "", handle = null) {
    const newFile = { id: Date.now().toString(), name, content, handle, mode: detectMode(name), isDirty: false };
    openFiles.push(newFile);
    switchToTab(newFile.id);
}

function closeTab(id) {
    const idx = openFiles.findIndex(f => f.id === id);
    openFiles = openFiles.filter(f => f.id !== id);
    if (id === activeFileId) {
        if (openFiles.length > 0) switchToTab(openFiles[Math.max(0, idx - 1)].id);
        else createNewTab();
    } else renderTabs();
    saveSession();
}

// --- 6. SESSION ---
function saveSession() {
    localStorage.setItem('notepad_session_v2', JSON.stringify({ files: openFiles.map(f => ({...f, handle: null})), activeId: activeFileId }));
}
function restoreSession() {
    try {
        const data = JSON.parse(localStorage.getItem('notepad_session_v2'));
        if (data && data.files.length > 0) { openFiles = data.files; activeFileId = data.activeId; return true; }
    } catch (e) {} return false;
}

// --- 7. LISTENERS ---
cm.on('change', (i, c) => {
    const text = cm.getValue();
    statsDisplay.textContent = `Lines: ${cm.lineCount()} | Words: ${text.trim().split(/\s+/).filter(w => w).length}`;
    const file = openFiles.find(f => f.id === activeFileId);
    if (file && c.origin !== 'setValue') { file.isDirty = true; renderTabs(); }
    updateMarkdownPreview();
});

btnPreview.addEventListener('click', () => {
    previewPane.classList.toggle('active');
    btnPreview.classList.toggle('active');
    updateMarkdownPreview();
    cm.refresh();
});

btnNewTab.addEventListener('click', () => createNewTab());
btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    cm.setOption('theme', isLight ? 'default' : 'darcula');
    btnTheme.textContent = isLight ? '🌙' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

if (!restoreSession()) createNewTab(); else switchToTab(activeFileId);
