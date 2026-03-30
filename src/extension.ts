import * as vscode from 'vscode';
import { MarkdownPreviewProvider } from './previewProvider';
import { TocProvider } from './tocProvider';

let previewProvider: MarkdownPreviewProvider;
let tocProvider: TocProvider;

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown X extension is now active');

    // Initialize providers
    previewProvider = new MarkdownPreviewProvider(context.extensionUri);
    tocProvider = new TocProvider();

    // Register webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewPanelSerializer('markdown-x-preview', previewProvider)
    );

    // Register TOC tree view
    const tocTreeView = vscode.window.createTreeView('markdown-x-toc', {
        treeDataProvider: tocProvider,
        showCollapseAll: true
    });
    context.subscriptions.push(tocTreeView);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.openPreview', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.languageId === 'markdown') {
                previewProvider.openPreview(activeEditor.document, false);
            } else {
                vscode.window.showWarningMessage('Please open a markdown file first');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.openPreviewToSide', () => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && activeEditor.document.languageId === 'markdown') {
                previewProvider.openPreview(activeEditor.document, true);
            } else {
                vscode.window.showWarningMessage('Please open a markdown file first');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.refreshPreview', () => {
            previewProvider.refresh();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.changeTheme', async () => {
            const themes = ['auto', 'light', 'dark', 'sepia'];
            const selected = await vscode.window.showQuickPick(themes, {
                placeHolder: 'Select preview theme'
            });
            if (selected) {
                await vscode.workspace.getConfiguration('markdown-x').update('theme', selected, true);
                previewProvider.updateTheme(selected);
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.toggleToc', async () => {
            const config = vscode.workspace.getConfiguration('markdown-x');
            const currentValue = config.get<boolean>('showToc', true);
            await config.update('showToc', !currentValue, true);
            vscode.commands.executeCommand('setContext', 'markdown-x:showToc', !currentValue);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-x.jumpToHeading', (line: number) => {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                const position = new vscode.Position(line, 0);
                activeEditor.selection = new vscode.Selection(position, position);
                activeEditor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );
            }
        })
    );

    // Listen for document changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.languageId === 'markdown') {
                previewProvider.updateContent(e.document);
                tocProvider.updateToc(e.document);
            }
        })
    );

    // Listen for active editor changes
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor && editor.document.languageId === 'markdown') {
                tocProvider.updateToc(editor.document);
                vscode.commands.executeCommand('setContext', 'markdown-x:showToc', true);
            } else {
                vscode.commands.executeCommand('setContext', 'markdown-x:showToc', false);
            }
        })
    );

    // Set initial context
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.languageId === 'markdown') {
        tocProvider.updateToc(activeEditor.document);
        vscode.commands.executeCommand('setContext', 'markdown-x:showToc', true);
    }
}

export function deactivate() {
    previewProvider?.dispose();
    tocProvider?.dispose();
}