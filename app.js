let fileHandle;

// DOM Elements
const editor = document.getElementById('editor');
const fileNameDisplay = document.getElementById('fileName');
const statsDisplay = document.getElementById('stats');
const dropZone = document.getElementById('dropZone');

// Buttons
const btnOpen = document.getElementById('btnOpen');
const btnSave = document.getElementById('btnSave');
const btnExport = document.getElementById('btnExport');
const btnClose = document.getElementById('btnClose');
const btnReplaceAll = document.getElementById('btnReplaceAll');

// 1. STATS UPDATER (Word & Line Count)
const updateStats = () => {
    const text = editor.value;
    const lines = text.split('\n').length;
    // Regex to split by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    statsDisplay.textContent = `Lines: ${lines} | Words: ${words}`;
};

// Update stats on typing
editor.addEventListener('input', updateStats);

// 2. FILE OPERATIONS
const pickerOptions = {
    types: [{
        description: 'Text Files',
        accept: { 'text/plain': ['.txt', '.csv', '.php', '.js', '.html', '.md', '.json'] },
    }],
};

async function openFile(handle) {
    try {
        const file = await handle.getFile();
        const contents = await file.text();
        editor.value = contents;
        fileHandle = handle;
        
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
        updateStats(); // Update stats immediately
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
        await writable.write(editor.value);
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
        // Trigger save logic manually
        const writable = await fileHandle.createWritable();
        await writable.write(editor.value);
        await writable.close();
        
        const file = await handle.getFile();
        document.title = `${file.name} - Notepad--`;
        fileNameDisplay.textContent = file.name;
    } catch (err) { /* Cancelled */ }
});

btnClose.addEventListener('click', () => {
    if(editor.value.length > 0 && !confirm("Close file? Unsaved changes will be lost.")) return;
    editor.value = "";
    fileHandle = null;
    document.title = "Notepad-minusminus";
    fileNameDisplay.textContent = "No file open";
    updateStats();
});

// 3. FIND & REPLACE
btnReplaceAll.addEventListener('click', () => {
    const find = document.getElementById('findInput').value;
    const replace = document.getElementById('replaceInput').value;
    if (!find) return;
    editor.value = editor.value.split(find).join(replace);
    updateStats();
});

// 4. DRAG & DROP
window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.display = 'flex';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.display = 'none';
});

dropZone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone.style.display = 'none'; // Hide overlay
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

// 5. KEYBOARD SHORTCUTS
document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); btnSave.click(); }
    if (e.ctrlKey && e.key === 'o') { e.preventDefault(); btnOpen.click(); }
});