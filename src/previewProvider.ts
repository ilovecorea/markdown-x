import * as vscode from 'vscode';
import { TocItem } from './tocProvider';

export class MarkdownPreviewProvider implements vscode.WebviewPanelSerializer {
    private panel: vscode.WebviewPanel | undefined;
    private currentDocument: vscode.TextDocument | undefined;
    private extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this.extensionUri = extensionUri;
    }

    async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: unknown
    ): Promise<void> {
        this.panel = webviewPanel;
        this.setupWebview();
    }

    openPreview(document: vscode.TextDocument, toSide: boolean): void {
        this.currentDocument = document;

        if (this.panel) {
            this.panel.reveal(toSide ? vscode.ViewColumn.Two : vscode.ViewColumn.One);
            this.updateContent(document);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'markdown-x-preview',
            `Preview: ${document.fileName.split('/').pop()}`,
            toSide ? vscode.ViewColumn.Two : vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    this.extensionUri,
                    vscode.Uri.file(document.fileName).with({ scheme: 'file' }).fsPath as any
                ]
            }
        );

        this.setupWebview();
        this.updateContent(document);
    }

    private setupWebview(): void {
        if (!this.panel) return;

        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
            },
            null,
            []
        );

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'scroll':
                        // Sync scroll position to editor
                        break;
                    case 'clickLink':
                        const linkPath = message.href;
                        if (linkPath.startsWith('http')) {
                            vscode.env.openExternal(vscode.Uri.parse(linkPath));
                        } else {
                            // Handle internal links
                            const docDir = this.currentDocument?.fileName 
                                ? this.currentDocument.fileName.substring(0, this.currentDocument.fileName.lastIndexOf('/'))
                                : '';
                            const fullPath = linkPath.startsWith('/') 
                                ? linkPath 
                                : `${docDir}/${linkPath}`;
                            try {
                                const doc = await vscode.workspace.openTextDocument(fullPath);
                                await vscode.window.showTextDocument(doc);
                            } catch {
                                vscode.window.showErrorMessage(`Cannot open: ${linkPath}`);
                            }
                        }
                        break;
                    case 'imageClick':
                        // Image lightbox is handled in webview
                        break;
                }
            },
            null,
            []
        );
    }

    updateContent(document: vscode.TextDocument): void {
        if (!this.panel || this.panel.webview.html === '') return;
        
        if (this.currentDocument?.fileName !== document.fileName) {
            return;
        }

        const html = this.generateHtml(document.getText(), document.fileName);
        this.panel.webview.html = html;
        this.panel.title = `Preview: ${document.fileName.split('/').pop()}`;
    }

    updateTheme(theme: string): void {
        this.panel?.webview.postMessage({ type: 'theme', theme });
    }

    refresh(): void {
        if (this.currentDocument) {
            this.updateContent(this.currentDocument);
        }
    }

    dispose(): void {
        this.panel?.dispose();
    }

    private generateHtml(content: string, filePath: string): string {
        const config = vscode.workspace.getConfiguration('markdown-x');
        const theme = config.get<string>('theme', 'auto');
        const fontSize = config.get<number>('fontSize', 16);
        const lineHeight = config.get<number>('lineHeight', 1.6);
        const enableMermaid = config.get<boolean>('enableMermaid', true);
        const enableImageLightbox = config.get<boolean>('enableImageLightbox', true);

        // Parse markdown to HTML (simplified version)
        const htmlContent = this.parseMarkdown(content, filePath);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Markdown X Preview</title>
    
    <!-- KaTeX for math -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
    
    <!-- Mermaid for diagrams -->
    ${enableMermaid ? `
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
    ` : ''}
    
    <!-- Highlight.js for code -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css" id="hljs-theme">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    
    <style>
        :root {
            --font-size: ${fontSize}px;
            --line-height: ${lineHeight};
            --max-width: 900px;
            --padding: 40px;
        }
        
        /* Base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            font-size: var(--font-size);
            line-height: var(--line-height);
            transition: background-color 0.3s, color 0.3s;
        }
        
        /* Theme: Auto (follows VS Code) */
        @media (prefers-color-scheme: dark) {
            body.theme-auto {
                --bg-color: #0d1117;
                --text-color: #c9d1d9;
                --heading-color: #e6edf3;
                --link-color: #58a6ff;
                --border-color: #30363d;
                --code-bg: #161b22;
                --blockquote-bg: #161b22;
                --blockquote-border: #30363d;
            }
        }
        
        body.theme-auto {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --heading-color: #1f2328;
            --link-color: #0969da;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --blockquote-bg: #f6f8fa;
            --blockquote-border: #d0d7de;
        }
        
        /* Theme: Light */
        body.theme-light {
            --bg-color: #ffffff;
            --text-color: #24292f;
            --heading-color: #1f2328;
            --link-color: #0969da;
            --border-color: #d0d7de;
            --code-bg: #f6f8fa;
            --blockquote-bg: #f6f8fa;
            --blockquote-border: #d0d7de;
        }
        
        /* Theme: Dark */
        body.theme-dark {
            --bg-color: #0d1117;
            --text-color: #c9d1d9;
            --heading-color: #e6edf3;
            --link-color: #58a6ff;
            --border-color: #30363d;
            --code-bg: #161b22;
            --blockquote-bg: #161b22;
            --blockquote-border: #30363d;
        }
        
        /* Theme: Sepia */
        body.theme-sepia {
            --bg-color: #f4ecd8;
            --text-color: #5b4636;
            --heading-color: #433422;
            --link-color: #0066cc;
            --border-color: #d7cbb3;
            --code-bg: #e8dec5;
            --blockquote-bg: #e8dec5;
            --blockquote-border: #d7cbb3;
        }
        
        body {
            background-color: var(--bg-color);
            color: var(--text-color);
        }
        
        .container {
            max-width: var(--max-width);
            margin: 0 auto;
            padding: var(--padding);
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 {
            color: var(--heading-color);
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
            line-height: 1.25;
        }
        
        h1 { font-size: 2em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h2 { font-size: 1.5em; border-bottom: 1px solid var(--border-color); padding-bottom: 0.3em; }
        h3 { font-size: 1.25em; }
        h4 { font-size: 1em; }
        h5 { font-size: 0.875em; }
        h6 { font-size: 0.85em; color: var(--text-color); opacity: 0.7; }
        
        p { margin-bottom: 1em; }
        
        a {
            color: var(--link-color);
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        /* Lists */
        ul, ol {
            margin-bottom: 1em;
            padding-left: 2em;
        }
        
        li { margin-bottom: 0.25em; }
        
        /* Code */
        code {
            font-family: 'SF Mono', Monaco, Inconsolata, 'Fira Code', monospace;
            font-size: 0.85em;
            background-color: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 3px;
        }
        
        pre {
            background-color: var(--code-bg);
            padding: 1em;
            border-radius: 6px;
            overflow-x: auto;
            margin-bottom: 1em;
        }
        
        pre code {
            background: none;
            padding: 0;
        }
        
        /* Blockquote */
        blockquote {
            background-color: var(--blockquote-bg);
            border-left: 4px solid var(--blockquote-border);
            padding: 0.5em 1em;
            margin-bottom: 1em;
        }
        
        blockquote p:last-child { margin-bottom: 0; }
        
        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1em;
        }
        
        th, td {
            border: 1px solid var(--border-color);
            padding: 0.5em 1em;
            text-align: left;
        }
        
        th {
            background-color: var(--code-bg);
            font-weight: 600;
        }
        
        /* Images */
        img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            cursor: ${enableImageLightbox ? 'zoom-in' : 'default'};
            transition: transform 0.2s;
        }
        
        ${enableImageLightbox ? `
        /* Lightbox */
        .lightbox {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            cursor: zoom-out;
        }
        
        .lightbox.active {
            display: flex;
        }
        
        .lightbox img {
            max-width: 90%;
            max-height: 90%;
            object-fit: contain;
        }
        ` : ''}
        
        /* Mermaid */
        .mermaid {
            text-align: center;
            margin: 1em 0;
        }
        
        /* Horizontal rule */
        hr {
            border: none;
            border-top: 1px solid var(--border-color);
            margin: 2em 0;
        }
        
        /* Task lists */
        .task-list-item {
            list-style-type: none;
        }
        
        .task-list-item input {
            margin-right: 0.5em;
        }
        
        /* Scrollbar styling */
        ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        
        ::-webkit-scrollbar-track {
            background: var(--bg-color);
        }
        
        ::-webkit-scrollbar-thumb {
            background: var(--border-color);
            border-radius: 5px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-color);
            opacity: 0.5;
        }
    </style>
</head>
<body class="theme-${theme}">
    <div class="container">
        <div id="content">${htmlContent}</div>
    </div>
    
    ${enableImageLightbox ? `
    <div id="lightbox" class="lightbox">
        <img id="lightbox-img" src="" alt="">
    </div>
    ` : ''}
    
    <script>
        // Initialize Mermaid
        ${enableMermaid ? `
        mermaid.initialize({
            startOnLoad: true,
            theme: '${theme === 'dark' ? 'dark' : 'default'}',
            securityLevel: 'loose'
        });
        ` : ''}
        
        // Initialize Highlight.js
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
            
            // Initialize KaTeX
            if (typeof renderMathInElement !== 'undefined') {
                renderMathInElement(document.body, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false}
                    ]
                });
            }
        });
        
        // Handle theme changes from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'theme') {
                document.body.className = 'theme-' + message.theme;
                ${enableMermaid ? `
                // Update mermaid theme
                location.reload();
                ` : ''}
            }
        });
        
        ${enableImageLightbox ? `
        // Lightbox functionality
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => {
                lightboxImg.src = img.src;
                lightbox.classList.add('active');
            });
        });
        
        lightbox.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
        ` : ''}
        
        // Handle link clicks
        document.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && !href.startsWith('#')) {
                    e.preventDefault();
                    vscode.postMessage({
                        type: 'clickLink',
                        href: href
                    });
                }
            });
        });
        
        // Scroll sync (report scroll position to extension)
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
                vscode.postMessage({
                    type: 'scroll',
                    percent: scrollPercent
                });
            }, 100);
        });
    </script>
</body>
</html>`;
    }

    private parseMarkdown(content: string, filePath: string): string {
        // Basic markdown parsing (simplified)
        let html = content
            // Escape HTML
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            
            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
            })
            
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            
            // Headers
            .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
            .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            
            // Bold and Italic
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            
            // Strikethrough
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            
            // Links
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            
            // Images
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
                // Handle relative paths
                if (!src.startsWith('http') && !src.startsWith('/')) {
                    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
                    src = 'file://' + dir + '/' + src;
                }
                return `<img src="${src}" alt="${alt}">`;
            })
            
            // Blockquotes
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            
            // Horizontal rules
            .replace(/^---$/gim, '<hr>')
            .replace(/^\*\*\*$/gim, '<hr>')
            .replace(/^___$/gim, '<hr>')
            
            // Unordered lists
            .replace(/^\- (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>')
            .replace(/^\+ (.*$)/gim, '<ul><li>$1</li></ul>')
            
            // Ordered lists
            .replace(/^\d+\. (.*$)/gim, '<ol><li>$1</li></ol>')
            
            // Mermaid diagrams
            .replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<div class="mermaid">$1</div>')
            
            // Line breaks
            .replace(/\n/gim, '<br>');

        // Fix consecutive list items
        html = html
            .replace(/<\/ul><br><ul>/g, '')
            .replace(/<\/ol><br><ol>/g, '');

        return html;
    }
}