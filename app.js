let fileHandle;
let currentFontSize = 14; // Default font size

// DOM Elements
const fileNameDisplay = document.getElementById('fileName');
const fileModeDisplay = document.getElementById('fileMode');
const statsDisplay = document.getElementById('stats');
const dropZone = document.getElementById('dropZone');
const languageSelect = document.getElementById('languageSelect');
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnExport = document.getElementById('btnExport');
const btnClose = document.getElementById('btnClose');
const btnReplaceAll = document.getElementById('btnReplaceAll');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');

// --- 1. INITIALIZE CODEMIRROR ---
const cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    theme: 'darcula',
    mode: 'text/plain',
    lineWrapping: true,
    matchBrackets: true,
    indentUnit: 4
});

// Load Auto-Saved content if available
const savedContent = localStorage.getItem('autosave_content');
if (savedContent) {
    cm.setValue(savedContent);
    fileNameDisplay.textContent = "Restored Session (Unsaved)";
}

// Update stats & Auto-Save on change
cm.on('change', () => {
    const text = cm.getValue();
    const lines = cm.lineCount();
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
    
    // Feature: Auto-Backup to LocalStorage
    localStorage.setItem('autosave_content', text);
    
    // Feature: Unsaved Indicator
    if (!fileNameDisplay.textContent.includes('*')) {
        fileNameDisplay.textContent += '*';
    }
});

// --- 2. ZOOM CONTROLS ---
const updateFontSize = () => {
    document.querySelector('.CodeMirror').style.fontSize = `${currentFontSize}px`;
    cm.refresh(); // Tell CodeMirror to re-calculate layout
};

btnZoomIn.addEventListener('click', () => {
    currentFontSize += 2;
    updateFontSize();
});

btnZoomOut.addEventListener('click', () => {
    currentFontSize = Math.max(8, currentFontSize - 2); // Minimum 8px
    updateFontSize();
});


// --- 3. LANGUAGE HANDLING ---
languageSelect.addEventListener('change', () => {
    const mode = languageSelect.value;
    cm.setOption('mode', mode);
    const modeName = languageSelect.options[languageSelect.selectedIndex].text;
    fileModeDisplay.textContent = `(${modeName})`;
});

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

// --- 4. FILE OPERATIONS ---
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
        
        cm.setValue(contents);
        cm.clearHistory();
        
        fileHandle = handle;
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
        
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
        await writable.write(cm.getValue());
        await writable.close();
        
        // Remove asterisk
        fileNameDisplay.textContent = fileNameDisplay.textContent.replace('*', '');
        
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
    localStorage.removeItem('autosave_content'); // Clear backup
    fileHandle = null;
    document.title = "Notepad-minusminus";
    fileNameDisplay.textContent = "No file open";
    fileModeDisplay.textContent = "(Plain Text)";
    languageSelect.value = "text/plain";
    cm.setOption('mode', 'text/plain');
});

// --- 5. FIND & REPLACE ---
btnReplaceAll.addEventListener('click', () => {
    const find = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    if (!find) return;
    
    const content = cm.getValue();
    const newContent = content.split(find).join(replace);
    
    if (content !== newContent) {
        const scrollInfo = cm.getScrollInfo();
        cm.setValue(newContent);
        cm.scrollTo(scrollInfo.left, scrollInfo.top);
    } else {
        alert("Text not found!");
    }
});

// --- 6. DRAG & DROP ---
window.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.display = 'none'; });
dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    if (items && items[0].kind === 'file') {
        try {
            const handle = await items[0].getAsFileSystemHandle();
            if (handle.kind === 'file') await openFile(handle);
        } catch (err) { console.error(err); }
    }
});

// --- 7. KEYBOARD SHORTCUTS ---
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
});
