# Markdown X

Ultimate Markdown Viewer for VS Code with enhanced reading experience.

## ✨ Features

### 🧭 Sidebar TOC Navigation
- **Hierarchical tree view** of all headings
- **Click to jump** to any section instantly
- **Auto-update** when document changes
- **Collapsible sections** for better organization

### 🎨 Independent Theme System
- **4 Built-in themes**: Auto (follows VS Code), Light, Dark, Sepia
- **VS Code theme independent** - customize preview separately
- **Eye-friendly Sepia mode** for long reading sessions
- **Instant theme switching** via command palette

### 🔍 Image Lightbox
- **Click to enlarge** any image in the document
- **Dark overlay background** for focus
- **Click anywhere to close** or press Escape
- **Smooth animations** and transitions

### 📊 Interactive Diagrams (Mermaid)
- **Flowcharts, Sequence diagrams, Class diagrams, Gantt charts**
- **Zoom and pan** support for large diagrams
- **Click interactions** for complex diagrams
- **Auto-render** on document update

### 📝 Enhanced Markdown Support
- **GitHub Flavored Markdown** compatibility
- **KaTeX math rendering** ($...$ and $$...$$)
- **Syntax highlighting** for 100+ languages
- **Scroll sync** between editor and preview

### ⚙️ Customizable Settings
```json
{
  "markdown-x.theme": "auto",
  "markdown-x.fontSize": 16,
  "markdown-x.lineHeight": 1.6,
  "markdown-x.enableMermaid": true,
  "markdown-x.enableImageLightbox": true,
  "markdown-x.enableScrollSync": true,
  "markdown-x.maxTocLevel": 6
}
```

## 🚀 Usage

### Opening Preview
1. **Command Palette** (`Cmd/Ctrl+Shift+P`): `Markdown X: Open Preview`
2. **Keyboard Shortcut**: Default keybinding available
3. **Editor Title**: Click the preview icon in the top right

### Sidebar TOC
- Open the **Explorer** sidebar
- Find **"Markdown X TOC"** panel
- Click any heading to jump

### Changing Theme
1. Open Command Palette
2. Type: `Markdown X: Change Theme`
3. Select: Auto / Light / Dark / Sepia

## 🛠️ Development

### Build
```bash
npm install
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Debug
Press `F5` in VS Code to open a new Extension Development Host window.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.