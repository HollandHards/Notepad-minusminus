let fileHandle;
let currentFontSize = 14;
let clipboardHistory = []; // Local history storage

// DOM Elements
const fileNameDisplay = document.getElementById('fileName');
const fileModeDisplay = document.getElementById('fileMode');
const statsDisplay = document.getElementById('stats');
const cursorPosDisplay = document.getElementById('cursorPos'); 
const dropZone = document.getElementById('dropZone');
const languageSelect = document.getElementById('languageSelect');
const mainToolbar = document.getElementById('mainToolbar');
const brandButton = document.getElementById('brandButton');

// Buttons & Inputs
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnSaveAs = document.getElementById('btnSaveAs');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnToggleWrap = document.getElementById('btnToggleWrap');
const btnTheme = document.getElementById('btnTheme');
const btnAction = document.getElementById('btnAction');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');

// New Clipboard Elements
const btnCopy = document.getElementById('btnCopy');
const btnPaste = document.getElementById('btnPaste');
const btnHistory = document.getElementById('btnHistory');
const historyMenu = document.getElementById('historyMenu');

// --- 1. INITIALIZE CODEMIRROR ---
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

// Load Config
const savedContent = localStorage.getItem('autosave_content');
if (savedContent) { cm.setValue(savedContent); fileNameDisplay.textContent = "Restored Session (Unsaved)"; }

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    cm.setOption('theme', 'default');
    btnTheme.textContent = '🌙';
}

// Stats Loop
const updateStats = () => {
    const text = cm.getValue();
    const lines = cm.lineCount();
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
    localStorage.setItem('autosave_content', text);
    if (!fileNameDisplay.textContent.includes('*')) fileNameDisplay.textContent += '*';
};
const updateCursorPos = () => {
    const pos = cm.getCursor();
    cursorPosDisplay.textContent = `Ln ${pos.line + 1}, Col ${pos.ch + 1}`;
};
cm.on('change', updateStats);
cm.on('cursorActivity', updateCursorPos);


// --- 2. CLIPBOARD LOGIC (NEW) ---

// Add text to internal history array
function addToHistory(text) {
    if (!text || !text.trim()) return;
    // Remove duplicate if exists, add to top
    clipboardHistory = [text, ...clipboardHistory.filter(t => t !== text)].slice(0, 5); // Keep last 5
}

// Render the dropdown menu
function renderHistoryMenu() {
    // Clear current list (except title)
    historyMenu.innerHTML = '<div class="history-title">Clipboard History</div>';
    
    if (clipboardHistory.length === 0) {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.textContent = '(Empty)';
        item.style.color = 'var(--text-muted)';
        historyMenu.appendChild(item);
    } else {
        clipboardHistory.forEach(text => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.textContent = text; // CSS handles truncation
            item.title = text; // Tooltip shows full text
            
            // Clicking an item pastes it
            item.addEventListener('click', () => {
                cm.replaceSelection(text);
                historyMenu.classList.remove('show');
                cm.focus();
            });
            historyMenu.appendChild(item);
        });
    }
}

// COPY Button
btnCopy.addEventListener('click', () => {
    const selection = cm.getSelection();
    if (selection) {
        navigator.clipboard.writeText(selection);
        addToHistory(selection);
        // Visual feedback
        const originalText = btnCopy.textContent;
        btnCopy.textContent = "✅ Copied";
        setTimeout(() => btnCopy.textContent = originalText, 1000);
    } else {
        alert("Select text to copy first.");
    }
});

// PASTE Button
btnPaste.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        cm.replaceSelection(text);
        addToHistory(text);
        cm.focus();
    } catch (err) {
        console.error('Failed to read clipboard', err);
        alert("Clipboard permission denied or empty.");
    }
});

// HISTORY Dropdown Toggle
btnHistory.addEventListener('click', (e) => {
    e.stopPropagation();
    renderHistoryMenu();
    historyMenu.classList.toggle('show');
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!historyMenu.contains(e.target) && e.target !== btnHistory) {
        historyMenu.classList.remove('show');
    }
});


// --- 3. UI FEATURES ---
btnToggleWrap.addEventListener('click', () => {
    const current = cm.getOption('lineWrapping');
    cm.setOption('lineWrapping', !current);
    btnToggleWrap.classList.toggle('active');
});

btnTheme.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    cm.setOption('theme', isLight ? 'default' : 'darcula');
    btnTheme.textContent = isLight ? '🌙' : '☀';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

function jumpToLine() {
    const line = prompt("Go to line number:");
    if (line && !isNaN(line)) {
        cm.setCursor(parseInt(line) - 1, 0);
        cm.focus();
    }
}

const updateFontSize = () => {
    document.querySelector('.CodeMirror').style.fontSize = `${currentFontSize}px`;
    cm.refresh();
};
btnZoomIn.addEventListener('click', () => { currentFontSize += 2; updateFontSize(); });
btnZoomOut.addEventListener('click', () => { currentFontSize = Math.max(8, currentFontSize - 2); updateFontSize(); });

// --- 4. MOBILE MENU ---
brandButton.addEventListener('click', () => {
    if (window.innerWidth <= 768) mainToolbar.classList.toggle('mobile-open');
});
cm.on('focus', () => mainToolbar.classList.remove('mobile-open'));
document.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    if(btn.id !== 'btnHistory') mainToolbar.classList.remove('mobile-open');
}));

// --- 5. LANGUAGE & FILE ---
languageSelect.addEventListener('change', () => {
    const mode = languageSelect.value;
    cm.setOption('mode', mode);
    fileModeDisplay.textContent = `(${languageSelect.options[languageSelect.selectedIndex].text})`;
});

const pickerOptions = { types: [{ description: 'Code & Text', accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] } }] };

function setModeByFilename(name) {
    const ext = name.split('.').pop().toLowerCase();
    let mode = 'text/plain'; 
    if (['html', 'htm'].includes(ext)) mode = 'text/html';
    else if (['css', 'scss'].includes(ext)) mode = 'text/css';
    else if (['js', 'jsx', 'ts'].includes(ext)) mode = 'text/javascript';
    else if (ext === 'php') mode = 'application/x-httpd-php';
    else if (ext === 'json') mode = 'application/json';
    else if (['xml', 'svg'].includes(ext)) mode = 'application/xml';
    cm.setOption('mode', mode);
    languageSelect.value = mode;
    fileModeDisplay.textContent = `(${languageSelect.options[languageSelect.selectedIndex].text})`;
}

async function openFile(handle) {
    try {
        const file = await handle.getFile();
        const contents = await file.text();
        cm.setValue(contents);
        cm.clearHistory();
        fileHandle = handle;
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
        setModeByFilename(file.name);
    } catch (err) { console.error(err); }
}

btnOpen.addEventListener('click', async () => { try { const [h] = await window.showOpenFilePicker(pickerOptions); await openFile(h); } catch(e){} });
btnSave.addEventListener('click', async () => {
    if (!fileHandle) return btnSaveAs.click();
    try {
        const w = await fileHandle.createWritable();
        await w.write(cm.getValue()); await w.close();
        fileNameDisplay.textContent = fileNameDisplay.textContent.replace('*', '');
        const original = btnSave.textContent; btnSave.textContent = "✅ Saved"; setTimeout(() => btnSave.textContent = "💾 Save", 1500);
    } catch(e){}
});
btnSaveAs.addEventListener('click', async () => {
    try {
        const h = await window.showSaveFilePicker(pickerOptions);
        const w = await h.createWritable();
        await w.write(cm.getValue()); await w.close();
        fileHandle = h; const f = await h.getFile();
        document.title = `${f.name} - Notepad--`;
        fileNameDisplay.textContent = f.name;
        setModeByFilename(f.name);
    } catch(e){}
});

// --- 6. SEARCH ---
let lastSearchQuery = '';
let searchCursor = null;
function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const triggerSearch = (e) => { if (e.key === 'Enter') { e.preventDefault(); btnAction.click(); } };
findInput.addEventListener('keydown', triggerSearch);
replaceInput.addEventListener('keydown', triggerSearch);

btnAction.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    if (!findText) return;

    if (replaceText === "") {
        if (findText !== lastSearchQuery || !searchCursor) {
            lastSearchQuery = findText;
            searchCursor = cm.getSearchCursor(findText, cm.getCursor(), {caseFold: true});
        }
        if (searchCursor.findNext()) {
            cm.setSelection(searchCursor.from(), searchCursor.to());
            cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100);
            cm.focus();
        } else {
            searchCursor = cm.getSearchCursor(findText, {line: 0, ch: 0}, {caseFold: true});
            if (searchCursor.findNext()) {
                cm.setSelection(searchCursor.from(), searchCursor.to());
                cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100); cm.focus();
            } else { alert("Text not found!"); }
        }
    } else {
        const content = cm.getValue();
        const regex = new RegExp(escapeRegExp(findText), "gi");
        const newContent = content.replace(regex, replaceText);
        if (content !== newContent) {
            const scrollInfo = cm.getScrollInfo();
            cm.setValue(newContent);
            cm.scrollTo(scrollInfo.left, scrollInfo.top);
            alert("Replaced all occurrences.");
        } else { alert("Text not found!"); }
    }
});

// --- 7. DRAG DROP & SHORTCUTS ---
window.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('active'); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (e.clientX === 0 && e.clientY === 0) { dropZone.classList.remove('active'); dropZone.style.display = 'none'; } });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.classList.remove('active'); dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    if (items && items[0].kind === 'file') {
        const h = await items[0].getAsFileSystemHandle();
        if (h.kind === 'file') await openFile(h);
    }
});
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); jumpToLine(); }
});
