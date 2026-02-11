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

const btnNewFile = document.getElementById('btnNewFile');
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnSaveMenu = document.getElementById('btnSaveMenu');
const saveDropdown = document.getElementById('saveDropdown');
const btnSaveAs = document.getElementById('btnSaveAs');

const btnNewTab = document.getElementById('btnNewTab');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnToggleWrap = document.getElementById('btnToggleWrap');
const btnTheme = document.getElementById('btnTheme');
const btnAction = document.getElementById('btnAction');
const btnCopy = document.getElementById('btnCopy');
const btnPaste = document.getElementById('btnPaste');
const btnHistory = document.getElementById('btnHistory');

const btnTools = document.getElementById('btnTools');
const toolsMenu = document.getElementById('toolsMenu');
const toolSort = document.getElementById('toolSort');
const toolTrim = document.getElementById('toolTrim');
const toolDup = document.getElementById('toolDup');
const toolUpper = document.getElementById('toolUpper');
const toolLower = document.getElementById('toolLower');

const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');

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
        "Ctrl-G": () => jumpToLine(),
        "Ctrl-D": () => duplicateLine(),
        "Ctrl-Shift-Up": () => moveLineUp(),
        "Ctrl-Shift-Down": () => moveLineDown()
    }
});

cm.getInputField().setAttribute('name', 'cm-editor-input');
cm.getInputField().setAttribute('id', 'cm-editor-input');

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
    if (['xml', 'svg'].includes(ext)) return 'application/xml';
    return 'text/plain';
}
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function saveFileFallback(filename, content) {
    const blob = new Blob([content], {type: "text/plain;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function createNewFileObj(name, content, handle = null) {
    return {
        id: Date.now().toString() + Math.random().toString().substr(2),
        name: name, content: content, handle: handle,
        mode: detectMode(name), history: { done: [], undone: [] },
        cursor: { line: 0, ch: 0 }, scrollInfo: { left: 0, top: 0 }, isDirty: false
    };
}
function renderTabs() {
    tabBar.innerHTML = '';
    openFiles.forEach(file => {
        const tab = document.createElement('div');
        tab.className = `tab ${file.id === activeFileId ? 'active' : ''}`;
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name'; nameSpan.textContent = file.name; nameSpan.title = file.name;
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close'; closeBtn.textContent = '✕';
        closeBtn.onclick = (e) => { e.stopPropagation(); closeTab(file.id); };
        tab.onclick = () => switchToTab(file.id);
        tab.appendChild(nameSpan);
        if (file.isDirty) { const d = document.createElement('span'); d.className = 'tab-dirty'; d.textContent = '*'; tab.appendChild(d); }
        tab.appendChild(closeBtn);
        tabBar.appendChild(tab);
        if (file.id === activeFileId) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}
function switchToTab(id) {
    if (activeFileId) {
        const oldFile = openFiles.find(f => f.id === activeFileId);
        if (oldFile) { oldFile.content = cm.getValue(); oldFile.history = cm.getHistory(); oldFile.cursor = cm.getCursor(); oldFile.scrollInfo = cm.getScrollInfo(); }
    }
    activeFileId = id; const newFile = openFiles.find(f => f.id === id);
    if (newFile) {
        cm.setValue(newFile.content); cm.setOption('mode', newFile.mode);
        cm.setHistory(newFile.history || { done: [], undone: [] });
        if (newFile.cursor) cm.setCursor(newFile.cursor);
        if (newFile.scrollInfo) cm.scrollTo(newFile.scrollInfo.left, newFile.scrollInfo.top);
        languageSelect.value = newFile.mode;
        fileModeDisplay.textContent = `(${languageSelect.options[languageSelect.selectedIndex].text})`;
        cm.focus();
    }
    renderTabs();
}
function createNewTab(name = "Untitled", content = "", handle = null) {
    const newFile = createNewFileObj(name, content, handle);
    openFiles.push(newFile); switchToTab(newFile.id);
}
function closeTab(id) {
    if (id === activeFileId) {
        const idx = openFiles.findIndex(f => f.id === id);
        const nextFile = openFiles[idx - 1] || openFiles[idx + 1];
        if (nextFile) switchToTab(nextFile.id); else { openFiles = []; activeFileId = null; createNewTab(); return; }
    }
    openFiles = openFiles.filter(f => f.id !== id); renderTabs();
}

// --- 6. EVENT LISTENERS ---
brandButton.addEventListener('click', () => { if (window.innerWidth <= 768) mainToolbar.classList.toggle('mobile-open'); else createNewTab(); });
btnNewTab.addEventListener('click', () => createNewTab());
if(btnNewFile) btnNewFile.addEventListener('click', () => createNewTab()); 

btnOpen.addEventListener('click', async () => {
    if (supportsFileSystem) { try { const [h] = await window.showOpenFilePicker(pickerOptions); const f = await h.getFile(); const c = await f.text(); createNewTab(f.name, c, h); } catch (e) {} } else fileInput.click();
});
fileInput.addEventListener('change', (e) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = (e) => createNewTab(f.name, e.target.result, null); r.readAsText(f); fileInput.value = ''; });

// SAVE & SAVE AS
function triggerSaveAs() {
    const file = openFiles.find(f => f.id === activeFileId); if (!file) return;
    trimWhitespace();
    if (supportsFileSystem) {
        window.showSaveFilePicker({ suggestedName: file.name, ...pickerOptions }).then(async (h) => {
            const w = await h.createWritable(); await w.write(cm.getValue()); await w.close(); const f = await h.getFile(); file.handle = h; file.name = f.name; file.isDirty = false; file.mode = detectMode(f.name); switchToTab(file.id);
        }).catch(e => {});
    } else { saveFileFallback(file.name, cm.getValue()); file.isDirty = false; renderTabs(); }
}

btnSave.addEventListener('click', async () => {
    const file = openFiles.find(f => f.id === activeFileId); if (!file) return; if (!file.handle) { triggerSaveAs(); return; }
    trimWhitespace();
    try {
        const w = await file.handle.createWritable(); await w.write(cm.getValue()); await w.close();
        file.isDirty = false; renderTabs(); const org = btnSave.textContent; btnSave.textContent = "✅ Saved"; setTimeout(() => btnSave.textContent = "💾 Save", 1500);
    } catch (e) { alert("Could not save file."); }
});

if (btnSaveMenu && saveDropdown) {
    btnSaveMenu.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        saveDropdown.classList.toggle('show'); 
    });
}
if (btnSaveAs) {
    btnSaveAs.addEventListener('click', () => { 
        triggerSaveAs(); 
        if(saveDropdown) saveDropdown.classList.remove('show'); 
    });
}

document.addEventListener('click', (e) => { 
    if (toolsMenu && !toolsMenu.contains(e.target) && e.target !== btnTools) toolsMenu.classList.remove('show');
    if (saveDropdown && !saveDropdown.contains(e.target) && e.target !== btnSaveMenu) saveDropdown.classList.remove('show'); 
    if (historyMenu && !historyMenu.contains(e.target) && e.target !== btnHistory) historyMenu.classList.remove('show');
});

btnTools.addEventListener('click', (e) => { e.stopPropagation(); toolsMenu.classList.toggle('show'); });
toolSort.addEventListener('click', () => { sortLines(); toolsMenu.classList.remove('show'); });
toolTrim.addEventListener('click', () => { trimWhitespace(); toolsMenu.classList.remove('show'); });
toolDup.addEventListener('click', () => { duplicateLine(); toolsMenu.classList.remove('show'); });
toolUpper.addEventListener('click', () => { changeCase('upper'); toolsMenu.classList.remove('show'); });
toolLower.addEventListener('click', () => { changeCase('lower'); toolsMenu.classList.remove('show'); });

const updateStats = (cmInstance, changeObj) => {
    const text = cm.getValue(); const lines = cm.lineCount(); const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
    const file = openFiles.find(f => f.id === activeFileId);
    if (file) {
        if (changeObj && changeObj.origin !== 'setValue') { if (!file.isDirty) { file.isDirty = true; renderTabs(); } }
        file.content = text; localStorage.setItem('autosave_content', text);
    }
};
cm.on('change', (i, c) => updateStats(i, c));
cm.on('cursorActivity', () => { const p = cm.getCursor(); cursorPosDisplay.textContent = `Ln ${p.line + 1}, Col ${p.ch + 1}`; });

function addToHistory(text) { if (!text || !text.trim()) return; clipboardHistory = [text, ...clipboardHistory.filter(t => t !== text)].slice(0, 5); }
function renderHistoryMenu() {
    historyMenu.innerHTML = '<div class="history-title">Clipboard History</div>';
    if (clipboardHistory.length === 0) { historyMenu.innerHTML += '<div style="padding:10px;color:#888;font-size:0.8rem;">(Empty)</div>'; return; }
    clipboardHistory.forEach(text => { const item = document.createElement('div'); item.className = 'history-item'; item.textContent = text; item.onclick = () => { cm.replaceSelection(text); historyMenu.classList.remove('show'); cm.focus(); }; historyMenu.appendChild(item); });
}
btnCopy.addEventListener('click', () => { const sel = cm.getSelection(); if (sel) { navigator.clipboard.writeText(sel); addToHistory(sel); const org = btnCopy.textContent; btnCopy.textContent = "✅"; setTimeout(() => btnCopy.textContent = "📄 Copy", 1000); } });
btnPaste.addEventListener('click', async () => { try { const text = await navigator.clipboard.readText(); cm.replaceSelection(text); addToHistory(text); cm.focus(); } catch (e) {} });
btnHistory.addEventListener('click', (e) => { e.stopPropagation(); renderHistoryMenu(); historyMenu.classList.toggle('show'); });

// --- REPLACED SEARCH LOGIC: ALWAYS REPLACE ALL ---
const triggerSearch = (e) => { if (e.key === 'Enter') { e.preventDefault(); btnAction.click(); } };
findInput.addEventListener('keydown', triggerSearch); replaceInput.addEventListener('keydown', triggerSearch);

btnAction.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    
    // Require at least a search term
    if (!findText) return;

    const content = cm.getValue();
    // Escape the search term so symbols don't break regex
    const regex = new RegExp(escapeRegExp(findText), "gi");
    
    // Replace all occurrences (even if replaceText is empty string)
    const newContent = content.replace(regex, replaceText);
    
    if (content !== newContent) {
        const scrollInfo = cm.getScrollInfo();
        cm.setValue(newContent);
        cm.scrollTo(scrollInfo.left, scrollInfo.top);
        // Removed alert to make it faster/smoother
    } else {
        alert("Text not found!");
    }
});

languageSelect.addEventListener('change', () => { const f = openFiles.find(x => x.id === activeFileId); if(f) { f.mode = languageSelect.value; cm.setOption('mode', f.mode); fileModeDisplay.textContent = `(${languageSelect.options[languageSelect.selectedIndex].text})`; } });
btnToggleWrap.addEventListener('click', () => { const c = cm.getOption('lineWrapping'); cm.setOption('lineWrapping', !c); btnToggleWrap.classList.toggle('active'); });
btnTheme.addEventListener('click', () => { document.body.classList.toggle('light-mode'); const isLight = document.body.classList.contains('light-mode'); cm.setOption('theme', isLight ? 'default' : 'darcula'); btnTheme.textContent = isLight ? '🌙' : '☀'; localStorage.setItem('theme', isLight ? 'light' : 'dark'); });
const updateFontSize = () => { document.querySelector('.CodeMirror').style.fontSize = `${currentFontSize}px`; cm.refresh(); };
btnZoomIn.addEventListener('click', () => { currentFontSize += 2; updateFontSize(); }); btnZoomOut.addEventListener('click', () => { currentFontSize = Math.max(8, currentFontSize - 2); updateFontSize(); });
cm.on('focus', () => mainToolbar.classList.remove('mobile-open'));
window.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('active'); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (e.clientX === 0 && e.clientY === 0) { dropZone.classList.remove('active'); dropZone.style.display = 'none'; } });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
dropZone.addEventListener('drop', async (e) => { e.preventDefault(); dropZone.classList.remove('active'); dropZone.style.display = 'none'; const items = e.dataTransfer.items; if (items && items[0].kind === 'file') { const h = await items[0].getAsFileSystemHandle(); if (h.kind === 'file') { const f = await h.getFile(); const c = await f.text(); createNewTab(f.name, c, h); } } });

const btnHelp = document.getElementById('btnHelp');
const helpModal = document.getElementById('helpModal');
const closeModal = document.getElementById('closeModal');
if (btnHelp) { btnHelp.addEventListener('click', (e) => { e.preventDefault(); helpModal.classList.add('show'); }); }
if (closeModal) { closeModal.addEventListener('click', () => helpModal.classList.remove('show')); }
if (helpModal) { helpModal.addEventListener('click', (e) => { if(e.target === helpModal) helpModal.classList.remove('show'); }); }

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); jumpToLine(); }
    if (e.altKey && e.key === 'n') { e.preventDefault(); createNewTab(); }
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); duplicateLine(); }
    if (e.altKey && e.key === 'w') { e.preventDefault(); if (activeFileId) closeTab(activeFileId); }
});

// PWA Launch Queue
if ('launchQueue' in window && 'files' in LaunchParams.prototype) {
    launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files.length) return;
        for (const handle of launchParams.files) {
            if (handle.kind === 'file') {
                if (openFiles.length === 1 && openFiles[0].name === "Untitled" && !openFiles[0].isDirty && openFiles[0].content === "") {
                     closeTab(openFiles[0].id);
                }
                try {
                    const file = await handle.getFile();
                    const content = await file.text();
                    createNewTab(file.name, content, handle);
                } catch (e) { console.error("Error handling launched file:", e); }
            }
        }
    });
}

if (openFiles.length === 0) { createNewTab(); }
