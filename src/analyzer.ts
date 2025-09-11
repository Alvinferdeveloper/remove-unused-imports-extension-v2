import * as ts from 'typescript';
import * as vscode from 'vscode';

/**
 * Analyzes the source code of a file to find unused imports.
 * @param sourceCode The source code to analyze.
 * @param fileName The name of the file being analyzed.
 * @returns An array of VS Code text edits to be applied.
 */
export function analyzeFile(sourceCode: string, fileName: string): vscode.TextEdit[] {
    const edits: vscode.TextEdit[] = [];
    const sourceFile = ts.createSourceFile(
        fileName,
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );

    const allIdentifiers = new Set<string>();
    const importedSymbols: {
        name: string,
        node: ts.Node,
        parent: ts.ImportDeclaration
    }[] = [];

    // First pass: collect all identifiers used in the code
    ts.forEachChild(sourceFile, function visit(node) {
        // We are not interested in identifiers from import declarations in this pass
        if (ts.isImportDeclaration(node)) {
            return;
        }

        if (ts.isIdentifier(node)) {
            allIdentifiers.add(node.text);
        }
        ts.forEachChild(node, visit);
    });

    // Second pass: collect all imported symbols
    ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
            const importClause = node.importClause;
            if (importClause) {
                // Handles: import defaultExport from 'module';
                if (importClause.name) {
                    importedSymbols.push({ name: importClause.name.text, node: importClause.name, parent: node });
                }

                // Handles: import { namedExport } from 'module';
                // and: import { namedExport as alias } from 'module';
                if (importClause.namedBindings) {
                    if (ts.isNamedImports(importClause.namedBindings)) {
                        importClause.namedBindings.elements.forEach(element => {
                            importedSymbols.push({ name: element.name.text, node: element, parent: node });
                        });
                    }
                    // Handles: import * as namespace from 'module';
                    else if (ts.isNamespaceImport(importClause.namedBindings)) {
                        importedSymbols.push({ name: importClause.namedBindings.name.text, node: importClause.namedBindings.name, parent: node });
                    }
                }
            }
        }
    });

    const unusedSymbols = importedSymbols.filter(symbol => !allIdentifiers.has(symbol.name));

    // Group unused symbols by their parent import declaration
    const unusedImportsByDeclaration = new Map<ts.ImportDeclaration, ts.Node[]>();
    for (const symbol of unusedSymbols) {
        if (!unusedImportsByDeclaration.has(symbol.parent)) {
            unusedImportsByDeclaration.set(symbol.parent, []);
        }
        unusedImportsByDeclaration.get(symbol.parent)!.push(symbol.node);
    }

    // Create edits for unused imports
    for (const [declaration, unusedNodes] of unusedImportsByDeclaration.entries()) {
        const isDefaultImportUnused = unusedNodes.some(node => ts.isIdentifier(node) && declaration.importClause?.name === node);
        const usedSpecifiers = (declaration.importClause?.namedBindings as ts.NamedImports)?.elements
            ?.filter(element => !unusedNodes.some(unused => unused === element));

        const isNamespaceImport = declaration.importClause?.namedBindings && ts.isNamespaceImport(declaration.importClause.namedBindings);
        const isNamespaceImportUsed = isNamespaceImport && !unusedNodes.some(node => ts.isIdentifier(node) && (node.parent as ts.NamespaceImport).name === node);

        if (isNamespaceImport && !isNamespaceImportUsed) {
            const range = getRange(sourceFile, declaration);
            edits.push(vscode.TextEdit.delete(new vscode.Range(range.start.line, 0, range.end.line + 1, 0)));
            continue;
        }

        const isDefaultImportUsed = declaration.importClause?.name && !isDefaultImportUnused;
        const defaultImportName = isDefaultImportUsed ? declaration.importClause.name.getText(sourceFile) : undefined;

        if (!defaultImportName && (!usedSpecifiers || usedSpecifiers.length === 0)) {
            const range = getRange(sourceFile, declaration);
            // Create a range from the start of the first line of the import
            // to the start of the line following the last line of the import.
            // This effectively deletes the entire block of lines the import occupies.
            const deletionRange = new vscode.Range(range.start.line, 0, range.end.line + 1, 0);
            edits.push(vscode.TextEdit.delete(deletionRange));
        } else {
            let newImport = 'import ';
            if (defaultImportName) {
                newImport += defaultImportName;
                if (usedSpecifiers && usedSpecifiers.length > 0) {
                    newImport += ', ';
                }
            }
            if (usedSpecifiers && usedSpecifiers.length > 0) {
                const newNamedImports = usedSpecifiers.map(s => s.getText(sourceFile)).join(', ');
                newImport += `{ ${newNamedImports} }`;
            }
            newImport += ` from ${declaration.moduleSpecifier.getText(sourceFile)};`;

            const originalImport = declaration.getText(sourceFile);
            if (newImport.trim() !== originalImport.trim()) {
                edits.push(vscode.TextEdit.replace(getRange(sourceFile, declaration), newImport));
            }
        }
    }

    return edits;
}

/**
 * Gets the vscode.Range for a given TypeScript node.
 */
function getRange(sourceFile: ts.SourceFile, node: ts.Node): vscode.Range {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return new vscode.Range(start.line, start.character, end.line, end.character);
}

