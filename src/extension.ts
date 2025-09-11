import * as vscode from 'vscode';
import { analyzeFile } from './analyzer';

export function activate(context: vscode.ExtensionContext) {

    // Command to clean unused imports in the currently active file
    const cleanCurrentFile = vscode.commands.registerCommand('RemoveUnusedImports.cleanCurrentFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor found.');
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'typescript' && document.languageId !== 'javascript') {
            vscode.window.showInformationMessage('This command only works on JavaScript and TypeScript files.');
            return;
        }

        try {
            await processFile(document);
            vscode.window.showInformationMessage(`Unused imports removed from ${document.fileName.split('\\').pop()}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
            console.error(error);
        }
    });

    // Command to clean unused imports in the entire project
    const cleanProject = vscode.commands.registerCommand('RemoveUnusedImports.cleanProject', async () => {
        const config = vscode.workspace.getConfiguration('RemoveUnusedImports');
        const excludePatterns = config.get<string[]>('exclude') || [];
        const excludeGlob = `{${excludePatterns.join(',')}}`;

        const files = await vscode.workspace.findFiles('{**/*.ts,**/*.js}', excludeGlob);
        if (files.length === 0) {
            vscode.window.showInformationMessage('No TypeScript or JavaScript files found in the project.');
            return;
        }

        let processedCount = 0;
        let errorCount = 0;

        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Removing unused imports",
            cancellable: true
        }, async (progress, token) => {
            for (const file of files) {
                if (token.isCancellationRequested) {
                    break;
                }
                const document = await vscode.workspace.openTextDocument(file);
                progress.report({ message: `Processing ${document.fileName.split('\\').pop()}` });
                try {
                    const changed = await processFile(document);
                    if (changed) {
                        processedCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`Error processing ${file.fsPath}:`, error);
                }
            }
        });

        vscode.window.showInformationMessage(`Project scan complete. Removed imports from ${processedCount} files. ${errorCount > 0 ? `${errorCount} files had errors.` : ''}`);
    });

    context.subscriptions.push(cleanCurrentFile, cleanProject);
}

/**
 * Analyzes a document, applies the necessary edits to remove unused imports,
 * and saves the document.
 * @param document The document to process.
 * @returns A promise that resolves to true if the file was changed, false otherwise.
 */
async function processFile(document: vscode.TextDocument): Promise<boolean> {
    const edits = analyzeFile(document.getText(), document.fileName);

    if (edits.length > 0) {
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.set(document.uri, edits);
        await vscode.workspace.applyEdit(workspaceEdit);
        // It's better to let the user's settings handle formatting on save.
        // Forcing it can be intrusive. If needed, it can be enabled like this:
        // await vscode.commands.executeCommand('editor.action.formatDocument');
        return true;
    }
    return false;
}

export function deactivate() { }