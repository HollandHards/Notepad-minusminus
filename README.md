# Notepad-minusminus (Notepad--) 📝

A lightweight, distraction-free, and privacy-centric code editor optimized for ChromeOS, yet universally compatible across platforms.

**Notepad--** operates as a Progressive Web App (PWA), utilizing the advanced File System Access API to facilitate direct manipulation of local files through the browser interface, mirroring the functionality of native desktop applications. The application incorporates a sophisticated multi-tab interface and intelligent coding capabilities, while maintaining full offline functionality.

## 🚀 Access the Application

[**Launch the Application Here**](https://hollandhards.github.io/Notepad-minusminus/)

## 📸 Interface Visualization

The application features a responsive design capable of adapting to user preference through distinct visual themes.

**Dark Mode (Default)**
*Figure 1: The default Dark Mode interface displaying syntax highlighting, the multi-tab system, and the Service Worker integration.*

**Light Mode**
*Figure 2: The Light Mode interface offering high-contrast visibility for alternative lighting environments.*

## ✨ Functional Overview

### 🖥️ Professional Editing Suite

* **Multi-Tab Interface:** Facilitates concurrent editing of multiple files within a unified tabbed layout.

* **Syntax Highlighting:** Provides automated syntax highlighting for HTML, CSS, JavaScript, PHP, XML, SQL, and JSON.

* **Intelligent Coding Assistance:**

  * **Auto-Completion:** Offers intelligent code suggestions via the `Ctrl + Space` keyboard shortcut.

  * **Code Folding:** Allows for the collapsing of code blocks via gutter indicators.

  * **Auto-Closure:** Automatically completes brackets `()` and HTML tags `<div>`.

* **Theme Customization:** Enables instant transitions between a refined **Dark Mode** (Darcula) and **Light Mode**.

### 🛠️ Advanced Utilities

* **Line Operations:**

  * **Sort Lines:** Alphabetizes selected text lines.

  * **Trim Whitespace:** Automatically removes trailing whitespace upon saving.

  * **Duplicate Line:** Expedites code duplication via `Ctrl + D`.

  * **Move Lines:** Facilitates vertical transposition of code blocks via `Ctrl + Shift + Arrows`.

* **Case Conversion:** Seamlessly toggles text case between uppercase and lowercase.

* **Advanced Search:** Includes advanced Find & Replace functionality with Regular Expression support and case-insensitivity.

* **Clipboard History:** Maintains an internal history of the five most recent clipboard actions.

### 📱 Mobile Optimization

* **Responsive Design:** The toolbar dynamically adapts into a collapsible menu on mobile devices.

* **Touch Optimization:** Features enlarged touch targets to enhance file operation usability on touchscreens.

## 🔒 Privacy and Security Architecture

Notepad-- is architected upon a **"Local-First"** principle, ensuring data sovereignty:

* **Client-Side Execution:** The application executes entirely within the client-side browser environment.

* **Local Data Storage:** Files remain strictly local; no data is transmitted to external servers. File operations interact directly with the device's local storage.

* **Zero Tracking Policy:** The application employs no analytics, cookies, or user account systems.

* **Offline Capability:** Following installation, the application functions independently of internet connectivity, guaranteeing data remains contained within the device.

## 📥 Installation Instructions

As a Progressive Web App (PWA), Notepad-- may be installed as a standalone application.

### ChromeOS / Edge / Chrome Desktop

1. Navigate to the [Live Demo](https://hollandhards.github.io/Notepad-minusminus/).

2. Select the **Install icon** (monitor with a down arrow) located in the address bar.

3. The application will launch in a dedicated window and appear in the system launcher.

### Firefox / Safari

* *Note: Current browser limitations regarding direct file editing apply to these platforms.*

* Notepad-- implements an **Intelligent Fallback Mechanism**: opening files utilizes the standard upload dialog, while saving initiates a download to the default "Downloads" directory.

## 🛠️ Keyboard Shortcuts Reference

| Shortcut | Action | 
 | ----- | ----- | 
| `Ctrl + S` | Save File | 
| `Ctrl + O` | Open File | 
| `Alt + N` | **New Tab** | 
| `Alt + W` | **Close Tab** | 
| `Ctrl + D` | **Duplicate Line** | 
| `Ctrl + Space` | **Auto-Complete** | 
| `Ctrl + G` | Go to Line Number | 
| `Ctrl + Shift + ↑/↓` | Move Line Up/Down | 
| `Tab` | Indent (4 spaces) | 
| `Enter` | Find Next (when within Search interface) | 

## 📝 Release Notes

### Version 1.6 (Current)

* **PWA Icon Persistence:**

  * bump service worker cache to **v1.6** to force a deep refresh of application assets.

  * Resolved an issue where the application icon would revert to a generic letter ("N") or fail to load on the ChromeOS shelf and Windows taskbar.

  * Refined `manifest.json` icon definitions to explicitly separate "any" and "maskable" purposes for better OS compatibility.

### Version 1.5

* **Asset Integrity:** Internal updates to ensure `logo.png` is correctly cached and served by the Service Worker immediately upon installation.

### Version 1.4

* **Enhanced Search Bar:**

  * Dedicated "Find" (🔎) and "Replace All" (🔁) buttons for clearer action.

  * "Replace All" now supports empty strings to delete text.

* **Streamlined UI:**

  * **New File Button:** Added a dedicated "📄 New" button for quick access.

  * **Split Save Button:** Combined "Save" and "Save As" into a dropdown menu.

  * **Compact Tools:** Moved "Word Wrap" and "Zoom" controls into the Tools menu to save toolbar space.

  * **Compact Layout:** Reduced button padding and gaps for a cleaner look.

* **Bug Fixes:**

  * **Editor Height:** Fixed an issue where the editor would shrink to a few lines; it now always fills 100% of the available vertical space.

  * **Session Restore:** Fixed a bug where reloading the page would sometimes clear the active tab's content.

  * **Markdown Preview:** Fixed synchronization issues when switching between Markdown preview and other tabs.

  * **Missing Buttons:** Fixed console errors related to moving buttons into menus.

### Version 1.3

* **Multi-Tab Interface:** Added support for multiple open files.

* **Auto-Completion:** Intelligent code suggestions.

* **PWA File Handlers:** Integration with OS "Open With" menu.

* **Logo Fixes:** Resolved PWA icon display issues on ChromeOS.

## 🏗️ Technical Architecture

* **Core Technologies:** Utilizes HTML5, CSS3 (leveraging variables for theming), and Vanilla JavaScript (ES6+).

* **Editor Engine:** Built upon the [CodeMirror 5](https://codemirror.net/5/) engine, augmented with custom extensions.

* **File Access:** Implements the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), with appropriate fallbacks for broad compatibility.

* **Offline Functionality:** Employs a Service Worker caching strategy (Stale-while-revalidate).

## 🤝 Contribution Guidelines

Contributions are welcomed. Please fork the repository and submit pull requests according to standard procedures.

1. Fork the repository.

2. Create a feature branch (`git checkout -b feature/NewFeature`).

3. Commit changes (`git commit -m 'Add some NewFeature'`).

4. Push to the branch (`git push origin feature/NewFeature`).

5. Submit a Open Pull Request.

## 📄 Licensing

This project is open-source software distributed under the [MIT License](https://www.google.com/search?q=LICENSE).
