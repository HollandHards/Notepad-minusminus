let fileHandle;

// DOM Elements
const fileNameDisplay = document.getElementById('fileName');
const fileModeDisplay = document.getElementById('fileMode');
const statsDisplay = document.getElementById('stats');
const dropZone = document.getElementById('dropZone');

// Buttons
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnExport = document.getElementById('btnExport');
const btnClose = document.getElementById('btnClose');
const btnReplaceAll = document.getElementById('btnReplaceAll');

// --- 1. INITIALIZE CODEMIRROR ---
// This replaces the standard textarea with the syntax highlighter
const cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    theme: 'darcula',
    mode: 'text/plain', // Default mode
    lineWrapping: true
});

// Update stats whenever text changes in CodeMirror
cm.on('change', () => {
    const text = cm.getValue();
    const lines = cm.lineCount();
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
});

// --- 2. LANGUAGE DETECTION ---
function setModeByFilename(name) {
    const extension = name.split('.').pop().toLowerCase();
    let mode = 'text/plain';
    let modeName = '(Plain Text)';

    if (extension === 'html') { mode = 'htmlmixed'; modeName = '(HTML)'; }
    else if (extension === 'js') { mode = 'javascript'; modeName = '(JavaScript)'; }
    else if (extension === 'css') { mode = 'css'; modeName = '(CSS)'; }
    else if (extension === 'php') { mode = 'application/x-httpd-php'; modeName = '(PHP)'; }
    else if (extension === 'json') { mode = 'application/json'; modeName = '(JSON)'; }
    else if (extension === 'csv') { mode = 'text/plain'; modeName = '(CSV)'; } // CSV stays plain for now
    
    cm.setOption('mode', mode);
    fileModeDisplay.textContent = modeName;
}

// --- 3. FILE OPERATIONS ---
const pickerOptions = {
    types: [{
        description: 'Code & Text',
        accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] },
    }],
};

async function openFile(handle) {
    try {
        const file = await handle.getFile();
        const contents = await file.text();
        
        // Load content into CodeMirror
        cm.setValue(contents);
        
        // Clear history (so you can't undo back to empty)
        cm.clearHistory();
        
        fileHandle = handle;
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
        
        // Auto-detect syntax
        setModeByFilename(file.name);
        
    } catch (err) {
        console.error("Error opening file", err);
    }
}

btnOpen.addEventListener('click', async () => {
    try {
        const [handle] = await window.showOpenFilePicker(pickerOptions);
        await openFile(handle);
    } catch (err) { /* Cancelled */ }
});

btnSave.addEventListener('click', async () => {
    if (!fileHandle) return btnExport.click();
    try {
        const writable = await fileHandle.createWritable();
        // Get text from CodeMirror
        await writable.write(cm.getValue()); 
        await writable.close();
        
        const originalText = btnSave.textContent;
        btnSave.textContent = "✅ Saved";
        setTimeout(() => btnSave.textContent = originalText, 1500);
    } catch (err) { console.error(err); }
});

btnExport.addEventListener('click', async () => {
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
    } catch (err) { /* Cancelled */ }
});

btnClose.addEventListener('click', () => {
    if(cm.getValue().length > 0 && !confirm("Close file? Unsaved changes will be lost.")) return;
    cm.setValue("");
    fileHandle = null;
    document.title = "Notepad-minusminus";
    fileNameDisplay.textContent = "No file open";
    fileModeDisplay.textContent = "(Plain Text)";
    cm.setOption('mode', 'text/plain');
});

// --- 4. FIND & REPLACE ---
btnReplaceAll.addEventListener('click', () => {
    const find = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    if (!find) return;
    
    // CodeMirror doesn't have a simple "Replace All" method without plugins,
    // so we do it via string manipulation and reload the value.
    const content = cm.getValue();
    // Using split/join for global replacement
    const newContent = content.split(find).join(replace);
    
    if (content !== newContent) {
        // Calculate scroll position to restore it after replace
        const scrollInfo = cm.getScrollInfo();
        cm.setValue(newContent);
        cm.scrollTo(scrollInfo.left, scrollInfo.top);
    } else {
        alert("Text not found!");
    }
});

// --- 5. DRAG & DROP ---
window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.display = 'flex';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.display = 'none';
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    
    if (items && items[0].kind === 'file') {
        try {
            const handle = await items[0].getAsFileSystemHandle();
            if (handle.kind === 'file') {
                await openFile(handle);
            }
        } catch (err) {
            console.error("Drop failed", err);
            alert("Could not open dropped file.");
        }
    }
});

// --- 6. KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
});
