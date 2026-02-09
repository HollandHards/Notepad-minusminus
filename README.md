# Notepad-minusminus (Notepad--) 📝

A lightweight, distraction-free, and dark-mode text editor built specifically for ChromeOS (but works everywhere). 

**Notepad--** is a Progressive Web App (PWA) that leverages the modern File System Access API to edit local files directly from your browser, just like a native desktop application. No accounts, no clouds, no tracking—just code.

## 🚀 Live Demo
[**Click here to use the app**](https://hollandhards.github.io/Notepad-minusminus/)  


---

## ✨ Features

### 🖥️ Desktop Experience
* **Native File Handling:** Open, edit, and save files directly to your hard drive (`.txt`, `.html`, `.css`, `.js`, `.php`, `.csv`, etc.).
* **Syntax Highlighting:** Automatic coloring for HTML, CSS, JavaScript, PHP, XML, and JSON.
* **Dark Mode:** Built-in Darcula theme for eye comfort.
* **Drag & Drop:** Drag files from your file manager directly into the window to open them.
* **Search & Replace:** * **Smart Search:** Press `Enter` to find next.
    * **Regex Support:** Use Regular Expressions for powerful find/replace operations.
    * **Case Insensitive:** Finds matches regardless of capitalization.
* **Auto-Save:** Saves your session to local storage automatically—never lose unsaved work if you accidentally close the tab.

### 📱 Mobile Friendly
* **Responsive Design:** The toolbar automatically collapses into a "Hamburger Menu" on mobile screens.
* **Touch Optimized:** Large tap targets for file operations.

### ⚡ Performance & UX
* **Smart Indentation:** Press `Tab` to insert 4 spaces (coding friendly).
* **Go to Line:** Press `Ctrl + G` to jump to a specific line number.
* **Line Wrapping:** Toggle word wrap on/off for viewing long logs or data files.
* **Zoom Controls:** Increase or decrease font size on the fly.
* **Offline Capable:** Works 100% offline via Service Worker caching.
## 🔒 Privacy and Security

Notepad-- is designed with a **"Local-First"** architecture. This means:

* **100% Client-Side:** The entire application runs directly in your browser.
* **No Cloud Storage:** Your files are **never** uploaded to any server. When you open a file, the browser reads it directly from your device's hard drive. When you save, it writes back to your drive.
* **Zero Tracking:** There are no analytics, cookies, or user accounts.
* **Offline Security:** Once installed, the app works without an internet connection, ensuring your data never leaves your device even by accident.



You can audit the source code in this repository to verify that no data is being sent externally.
---

## 📥 How to Install (ChromeOS / Windows / Mac)

Since this is a Progressive Web App (PWA), you can install it as a standalone app.

1.  **Open the App:** Go to the [Live Demo URL](https://hollandhards.github.io/Notepad-minusminus/).
2.  **Install:**
    * **ChromeOS:** Click the "Install Notepad--" icon (monitor with a down arrow) in the right side of the address bar.
    * **Mobile (Android):** Tap the browser menu (⋮) -> "Add to Home Screen".
3.  **Launch:** The app will now appear in your app drawer/launcher and open in its own window without the browser interface.

---

## 🛠️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + O` | Open File |
| `Ctrl + S` | Save File |
| `Ctrl + G` | Go to Line Number |
| `Enter` | Find Next (when in Search box) |
| `Tab` | Indent (4 spaces) |

---

## 🏗️ Technical Stack

* **Core:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Editor Engine:** [CodeMirror 5](https://codemirror.net/5/)
* **File Access:** [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
* **Offline:** Service Worker caching strategy (Stale-while-revalidate)

---

## 🤝 Contributing

Feel free to fork this repository and submit pull requests. 
1.  Fork the repo.
2.  Create your feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add some NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
