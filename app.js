let fileHandle;
let currentFontSize = 14;

// DOM Elements
const fileNameDisplay = document.getElementById('fileName');
const fileModeDisplay = document.getElementById('fileMode');
const statsDisplay = document.getElementById('stats');
const cursorPosDisplay = document.getElementById('cursorPos'); 
const dropZone = document.getElementById('dropZone');
const languageSelect = document.getElementById('languageSelect');
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnSaveAs = document.getElementById('btnSaveAs');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnToggleWrap = document.getElementById('btnToggleWrap');
const btnAction = document.getElementById('btnAction');
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');

// --- 1. INITIALIZE CODEMIRROR ---
const cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    theme: 'darcula',
    mode: 'text/plain',
    lineWrapping: true,
    matchBrackets: true,
    indentUnit: 4,
    extraKeys: {
        "Tab": function(cm) {
            if (cm.somethingSelected()) {
                cm.indentSelection("add");
            } else {
                cm.replaceSelection("    ", "end");
            }
        },
        "Ctrl-G": function(cm) { jumpToLine(); }
    }
});

// Restore Autosave
const savedContent = localStorage.getItem('autosave_content');
if (savedContent) {
    cm.setValue(savedContent);
    fileNameDisplay.textContent = "Restored Session (Unsaved)";
}

// Stats & Cursor Tracking
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

// --- 2. UX FEATURES ---
btnToggleWrap.addEventListener('click', () => {
    const current = cm.getOption('lineWrapping');
    cm.setOption('lineWrapping', !current);
    btnToggleWrap.classList.toggle('active');
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

// --- 3. LANGUAGE LOGIC ---
languageSelect.addEventListener('change', () => {
    const mode = languageSelect.value;
    cm.setOption('mode', mode);
    const modeName = languageSelect.options[languageSelect.selectedIndex].text;
    fileModeDisplay.textContent = `(${modeName})`;
});

// --- 4. IMPROVED SEARCH & REPLACE ---
let lastSearchQuery = '';
let searchCursor = null;

// Helper to escape special regex characters (like . * + ? etc.)
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

btnAction.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!findText) return;

    // A. FIND NEXT (Case Insensitive)
    if (replaceText === "") {
        // If query changed or we don't have a cursor, start a new one from current position
        if (findText !== lastSearchQuery || !searchCursor) {
            lastSearchQuery = findText;
            // Get cursor starting from where the user currently is
            searchCursor = cm.getSearchCursor(findText, cm.getCursor(), {caseFold: true});
        }

        // Try to find next match
        if (searchCursor.findNext()) {
            cm.setSelection(searchCursor.from(), searchCursor.to());
            cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100); // 100px margin
            cm.focus(); // CRITICAL: This makes the blue highlight visible!
        } else {
            // If not found, loop back to the top of the document
            searchCursor = cm.getSearchCursor(findText, {line: 0, ch: 0}, {caseFold: true});
            if (searchCursor.findNext()) {
                cm.setSelection(searchCursor.from(), searchCursor.to());
                cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 100);
                cm.focus();
            } else {
                alert("Text not found!");
            }
        }
    } 
    // B. REPLACE ALL (Case Insensitive)
    else {
        const content = cm.getValue();
        // Create a Regex with 'g' (global) and 'i' (insensitive) flags
        const regex = new RegExp(escapeRegExp(findText), "gi");
        
        const newContent = content.replace(regex, replaceText);
        
        if (content !== newContent) {
            // Keep the scroll position
            const scrollInfo = cm.getScrollInfo();
            cm.setValue(newContent);
            cm.scrollTo(scrollInfo.left, scrollInfo.top);
            alert("Replaced all occurrences.");
        } else {
            alert("Text not found!");
        }
    }
});

// --- 5. FILE OPERATIONS ---
const pickerOptions = {
    types: [{ description: 'Code & Text', accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] } }],
};

function setModeByFilename(name) {
    const extension = name.split('.').pop().toLowerCase();
    let mode = 'text/plain'; 
    if (['html', 'htm', 'phtml'].includes(extension)) mode = 'text/html';
    else if (['css', 'scss', 'less'].includes(extension)) mode = 'text/css';
    else if (['js', 'jsx', 'ts'].includes(extension)) mode = 'text/javascript';
    else if (extension === 'php') mode = 'application/x-httpd-php';
    else if (extension === 'json') mode = 'application/json';
    else if (['xml', 'svg'].includes(extension)) mode = 'application/xml';
    cm.setOption('mode', mode);
    languageSelect.value = mode;
    const option = Array.from(languageSelect.options).find(o => o.value === mode);
    if(option) fileModeDisplay.textContent = `(${option.text})`;
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

btnOpen.addEventListener('click', async () => { try { const [handle] = await window.showOpenFilePicker(pickerOptions); await openFile(handle); } catch (e) {} });
btnSave.addEventListener('click', async () => {
    if (!fileHandle) return btnSaveAs.click();
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(cm.getValue());
        await writable.close();
        fileNameDisplay.textContent = fileNameDisplay.textContent.replace('*', '');
        const originalText = btnSave.textContent;
        btnSave.textContent = "✅ Saved";
        setTimeout(() => btnSave.textContent = "💾 Save", 1500);
    } catch (e) {}
});
btnSaveAs.addEventListener('click', async () => {
    try {
        const handle = await window.showSaveFilePicker(pickerOptions);
        fileHandle = handle;
        const writable = await fileHandle.createWritable();
        await writable.write(cm.getValue());
        await writable.close();
        const file = await handle.getFile();
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
        setModeByFilename(file.name);
    } catch (e) {}
});

// --- 6. DRAG & DROP ---
window.addEventListener('dragenter', (e) => { e.preventDefault(); dropZone.classList.add('active'); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); if (e.clientX === 0 && e.clientY === 0) { dropZone.classList.remove('active'); dropZone.style.display = 'none'; } });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); });
dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.classList.remove('active'); dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    if (items && items[0].kind === 'file') {
        const handle = await items[0].getAsFileSystemHandle();
        if (handle.kind === 'file') await openFile(handle);
    }
});

// --- 7. SHORTCUTS ---
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
    if (e.ctrlKey && e.key === 'g') { e.preventDefault(); jumpToLine(); }
});
