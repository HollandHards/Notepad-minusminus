// --- 1. GLOBAL CONSTANTS & CONFIG ---
const pickerOptions = {
    types: [{
        description: 'Code & Text',
        accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] }
    }],
};

let currentFontSize = 14;
let clipboardHistory = [];
let openFiles = []; 
let activeFileId = null;

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

// Buttons
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
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

// Inputs
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
    extraKeys: {
        "Tab": (cm) => cm.somethingSelected() ? cm.indentSelection("add") : cm.replaceSelection("    ", "end"),
        "Ctrl-G": () => jumpToLine()
    }
});

// Load Theme Config
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    cm.setOption('theme', 'default');
    btnTheme.textContent = '🌙';
}

// --- 4. HELPER FUNCTIONS ---
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

// --- 5. TAB LOGIC ---
function createNewFileObj(name, content, handle = null) {
    return {
        id: Date.now().toString() + Math.random().toString().substr(2),
        name: name,
        content: content,
        handle: handle,
        mode: detectMode(name),
        history: { done: [], undone: [] },
        cursor: { line: 0, ch: 0 },
        scrollInfo: { left: 0, top: 0 },
        isDirty: false
    };
}

function renderTabs() {
    tabBar.innerHTML = '';
    openFiles.forEach(file => {
        const tab = document.createElement('div');
        tab.className = `tab ${file.id === activeFileId ? 'active' : ''}`;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'tab-name';
        nameSpan.textContent = file.name + (file.isDirty ? '*' : '');
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'tab-close';
        closeBtn.textContent = '✕';
        closeBtn.onclick = (e) => { e.stopPropagation(); closeTab(file.id); };
        
        tab.onclick = () => switchToTab(file.id);
        
        tab.appendChild(nameSpan);
        tab.appendChild(closeBtn);
        tabBar.appendChild(tab);
        
        if (file.id === activeFileId) tab.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
}

function switchToTab(id) {
    // Save state of current tab
    if (activeFileId) {
        const oldFile = openFiles.find(f => f.id === activeFileId);
        if (oldFile) {
            oldFile.content = cm.getValue();
            oldFile.history = cm.getHistory();
            oldFile.cursor = cm.getCursor();
            oldFile.scrollInfo = cm.getScrollInfo();
        }
    }

    activeFileId = id;
    const newFile = openFiles.find(f => f.id === id);

    if (newFile) {
        // Load new tab state
        // This triggers 'change' event with origin 'setValue'
        cm.setValue(newFile.content); 
        cm.setOption('mode', newFile.mode);
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
    openFiles.push(newFile);
    switchToTab(newFile.id);
}

function closeTab(id) {
    if (id === activeFileId) {
        const idx = openFiles.findIndex(f => f.id === id);
        const nextFile = openFiles[idx - 1] || openFiles[idx + 1];
        if (nextFile) switchToTab(nextFile.id);
        else { openFiles = []; activeFileId = null; createNewTab(); return; }
    }
    openFiles = openFiles.filter(f => f.id !== id);
    renderTabs();
}

// --- 6. EVENT LISTENERS ---
// Brand Button: Mobile Toggle or Desktop New Tab
brandButton.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
        mainToolbar.classList.toggle('mobile-open');
    } else {
        createNewTab();
    }
});

btnNewTab.addEventListener('click', () => createNewTab());

btnOpen.addEventListener('click', async () => {
    try {
        const [handle] = await window.showOpenFilePicker(pickerOptions);
        const file = await handle.getFile();
        const content = await file.text();
        createNewTab(file.name, content, handle);
    } catch (e) { console.warn("Open cancelled:", e); }
});

btnSave.addEventListener('click', async () => {
    const file = openFiles.find(f => f.id === activeFileId);
    if (!file) return;
    if (!file.handle) { btnSaveAs.click(); return; }
    try {
        const writable = await file.handle.createWritable();
        await writable.write(cm.getValue()); await writable.close();
        file.isDirty = false; renderTabs();
        const originalText = btnSave.textContent; btnSave.textContent = "✅ Saved"; setTimeout(() => btnSave.textContent = "💾 Save", 1500);
    } catch (e) { alert("Could not save file."); }
});

btnSaveAs.addEventListener('click', async () => {
    const file = openFiles.find(f => f.id === activeFileId);
    if (!file) return;
    try {
        const handle = await window.showSaveFilePicker(pickerOptions);
        const writable = await handle.createWritable();
        await writable.write(cm.getValue()); await writable.close();
        const f = await handle.getFile();
        file.handle = handle; file.name = f.name; file.isDirty = false; file.mode = detectMode(f.name);
        switchToTab(file.id); 
    } catch (e) {}
});

// --- 7. EDITOR EVENTS (FIXED) ---
// We now accept the changeObj argument from CodeMirror
const updateStats = (cmInstance, changeObj) => {
    const text = cm.getValue();
    const lines = cm.lineCount();
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
    
    const file = openFiles.find(f => f.id === activeFileId);
    if (file) {
        // CRITICAL FIX: Only mark dirty if the change is NOT from 'setValue' (programmatic loading)
        if (changeObj && changeObj.origin !== 'setValue') {
            if (!file.isDirty) { 
                file.isDirty = true; 
                renderTabs(); 
            }
        }
        
        file.content = text; 
        localStorage.setItem('autosave_content', text); 
    }
};

// Bind the change event with the change object
cm.on('change', (instance, changeObj) => updateStats(instance, changeObj));

cm.on('cursorActivity', () => {
    const pos = cm.getCursor();
    cursorPosDisplay.textContent = `Ln ${pos.line + 1}, Col ${pos.ch + 1}`;
});

// --- 8. CLIPBOARD & SEARCH & UI ---
function addToHistory(text) {
    if (!text || !text.trim()) return;
    clipboardHistory = [text, ...clipboardHistory.filter(t => t !== text)].slice(0, 5);
}
function renderHistoryMenu() {
    historyMenu.innerHTML = '<div class="history-title">Clipboard History</div>';
    if (clipboardHistory.length === 0) { historyMenu.innerHTML += '<div style="padding:10px;color:#888;font-size:0.8rem;">(Empty)</div>'; return; }
    clipboardHistory.forEach(text => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = text;
        item.onclick = () => { cm.replaceSelection(text); historyMenu.classList.remove('show'); cm.focus(); };
        historyMenu.appendChild(item);
    });
}
btnCopy.addEventListener('click', () => {
    const sel = cm.getSelection();
    if (sel) { navigator.clipboard.writeText(sel); addToHistory(sel); 
    const original = btnCopy.textContent; btnCopy.textContent = "✅"; setTimeout(() => btnCopy.textContent = original, 1000); }
});
btnPaste.addEventListener('click', async () => {
    try { const text = await navigator.clipboard.readText(); cm.replaceSelection(text); addToHistory(text); cm.focus(); } catch (e) {}
});
btnHistory.addEventListener('click', (e) => { e.stopPropagation(); renderHistoryMenu(); historyMenu.classList.toggle('show'); });
document.addEventListener('click', (e) => { if (!historyMenu.contains(e.target) && e.target !== btnHistory) historyMenu.classList.remove('show'); });

let lastSearchQuery = '';
let searchCursor = null;
const triggerSearch = (e) => { if (e.key === 'Enter') { e.preventDefault(); btnAction.click(); } };
findInput.addEventListener('keydown', triggerSearch);
replaceInput.addEventListener('keydown', triggerSearch);

btnAction.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    if (!findText) return;

    if (replaceText === "") {
        if (findText !== lastSearchQuery || !searchCursor) { lastSearchQuery = findText; searchCursor = cm.getSearchCursor(findText, cm.getCursor(), {caseFold: true}); }
        if (searchCursor.findNext()) { cm.setSelection(searchCursor.from(), searchCursor.to()); cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100); cm.focus(); }
        else { searchCursor = cm.getSearchCursor(findText, {line: 0, ch: 0}, {caseFold: true}); if (searchCursor.findNext()) { cm.setSelection(searchCursor.from(), searchCursor.to()); cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100); cm.focus(); } else { alert("Text not found!"); } }
    } else {
        const content = cm.getValue();
        const regex = new RegExp(escapeRegExp(findText), "gi");
        const newContent = content.replace(regex, replaceText);
        if (content !== newContent) { cm.setValue(newContent); alert("Replaced all occurrences."); } else { alert("Text not found!"); }
    }
});

languageSelect.addEventListener('change', () => {
    const file = openFiles.find(f => f.id === activeFileId);
    if(file) { file.mode = languageSelect.value; cm.setOption('mode', file.mode); fileModeDisplay.textContent = `(${languageSelect.options[languageSelect.selectedIndex].text})`; }
});
btnToggleWrap.addEventListener('click', () => { const c = cm.getOption('lineWrapping'); cm.setOption('lineWrapping', !c); btnToggleWrap.classList.toggle('active'); });
btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    cm.setOption('theme', isLight ? 'default' : 'darcula');
    btnTheme.textContent = isLight ? '🌙' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});
const updateFontSize = () => { document.querySelector('.CodeMirror').style.fontSize = `${currentFontSize}px`; cm.refresh(); };
btnZoomIn.addEventListener('click', () => { currentFontSize += 2; updateFontSize(); });
btnZoomOut.addEventListener('click', () => { currentFontSize = Math.max(8, currentFontSize - 2); updateFontSize(); });

cm.on('focus', () => mainToolbar.classList.remove('mobile-open'));
window.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('active'); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (e.clientX === 0 && e.clientY === 0) { dropZone.classList.remove('active'); dropZone.style.display = 'none'; } });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.classList.remove('active'); dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    if (items && items[0].kind === 'file') {
        const h = await items[0].getAsFileSystemHandle();
        if (h.kind === 'file') { const f = await h.getFile(); const c = await f.text(); createNewTab(f.name, c, h); }
    }
});

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); jumpToLine(); }
    if (e.altKey && e.key === 'n') { e.preventDefault(); createNewTab(); }
});

if (openFiles.length === 0) { createNewTab(); }
