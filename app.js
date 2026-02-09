let fileHandle;
let currentFontSize = 14;

// DOM Elements
const fileNameDisplay = document.getElementById('fileName');
const statsDisplay = document.getElementById('stats');
const dropZone = document.getElementById('dropZone');
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnSaveAs = document.getElementById('btnSaveAs');
const btnZoomIn = document.getElementById('btnZoomIn');
const btnZoomOut = document.getElementById('btnZoomOut');
const btnAction = document.getElementById('btnAction'); // Renamed button
const findInput = document.getElementById('findInput');
const replaceInput = document.getElementById('replaceInput');

// --- 1. INITIALIZE CODEMIRROR ---
const cm = CodeMirror.fromTextArea(document.getElementById('editor'), {
    lineNumbers: true,
    theme: 'darcula',
    mode: 'text/plain',
    lineWrapping: true,
    matchBrackets: true
});

// Load Auto-Saved content
const savedContent = localStorage.getItem('autosave_content');
if (savedContent) {
    cm.setValue(savedContent);
    fileNameDisplay.textContent = "Restored Session (Unsaved)";
}

cm.on('change', () => {
    const text = cm.getValue();
    const lines = cm.lineCount();
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
    localStorage.setItem('autosave_content', text);
    if (!fileNameDisplay.textContent.includes('*')) fileNameDisplay.textContent += '*';
});

// --- 2. ZOOM CONTROLS ---
const updateFontSize = () => {
    document.querySelector('.CodeMirror').style.fontSize = `${currentFontSize}px`;
    cm.refresh();
};
btnZoomIn.addEventListener('click', () => { currentFontSize += 2; updateFontSize(); });
btnZoomOut.addEventListener('click', () => { currentFontSize = Math.max(8, currentFontSize - 2); updateFontSize(); });

// --- 3. SEARCH & REPLACE LOGIC ---
let lastSearchQuery = '';
let searchCursor = null;

btnAction.addEventListener('click', () => {
    const findText = findInput.value;
    const replaceText = replaceInput.value;
    
    if (!findText) return;

    // CASE A: SEARCH ONLY (Replace is empty)
    if (replaceText === "") {
        // If query changed or cursor missing, start new search
        if (findText !== lastSearchQuery || !searchCursor) {
            lastSearchQuery = findText;
            searchCursor = cm.getSearchCursor(findText);
        }

        // Find next occurrence
        if (searchCursor.findNext()) {
            cm.setSelection(searchCursor.from(), searchCursor.to());
            cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 20);
        } else {
            // Loop back to start
            searchCursor = cm.getSearchCursor(findText);
            if (searchCursor.findNext()) {
                cm.setSelection(searchCursor.from(), searchCursor.to());
                cm.scrollIntoView({from: searchCursor.from(), to: searchCursor.to()}, 20);
            } else {
                alert("Text not found!");
            }
        }
    } 
    // CASE B: REPLACE ALL (Replace has text)
    else {
        const content = cm.getValue();
        const newContent = content.split(findText).join(replaceText);
        if (content !== newContent) {
            cm.setValue(newContent);
        } else {
            alert("Text not found!");
        }
    }
});

// --- 4. FILE OPERATIONS & AUTO-DETECT ---
const pickerOptions = {
    types: [{
        description: 'Code & Text',
        accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.css', '.json', '.md'] },
    }],
};

function setModeByFilename(name) {
    const extension = name.split('.').pop().toLowerCase();
    let mode = 'text/plain'; 
    if (['html', 'htm', 'phtml'].includes(extension)) mode = 'text/html';
    else if (['css', 'scss', 'less'].includes(extension)) mode = 'text/css';
    else if (['js', 'jsx', 'ts'].includes(extension)) mode = 'text/javascript';
    else if (extension === 'php') mode = 'application/x-httpd-php';
    else if (extension === 'json') mode = 'application/json';
    cm.setOption('mode', mode);
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

btnOpen.addEventListener('click', async () => {
    try { const [handle] = await window.showOpenFilePicker(pickerOptions); await openFile(handle); } catch (e) {}
});

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

// --- 5. DRAG & DROP & SHORTCUTS ---
window.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.display = 'flex'; });
dropZone.addEventListener('dragleave', () => { dropZone.style.display = 'none'; });
dropZone.addEventListener('drop', async (e) => {
    e.preventDefault(); dropZone.style.display = 'none';
    const items = e.dataTransfer.items;
    if (items && items[0].kind === 'file') {
        const handle = await items[0].getAsFileSystemHandle();
        if (handle.kind === 'file') await openFile(handle);
    }
});

document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
});
