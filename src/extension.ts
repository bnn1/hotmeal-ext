import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Register a command that formats Hotmeal document
    let disposable = vscode.commands.registerCommand('hotmeal.format', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        if (document.languageId !== 'hotmeal') {
            return;
        }

        editor.edit(editBuilder => {
            const text = document.getText();
            const formatted = formatHotmeal(text);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            editBuilder.replace(fullRange, formatted);
        });
    });

    context.subscriptions.push(disposable);

    // Register a formatter provider
    vscode.languages.registerDocumentFormattingEditProvider('hotmeal', {
        provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
            const text = document.getText();
            const formatted = formatHotmeal(text);
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });
}

function formatHotmeal(text: string): string {
    // Split the document into lines
    const lines = text.split(/\r?\n/);
    const formattedLines: string[] = [];
    
    // Stack to keep track of indentation level
    const indentStack: string[] = [];
    let currentIndent = '';
    
    // Process each line
    for (let line of lines) {
        const trimmedLine = line.trim();
        
        // Check if this line is a Hotmeal statement
        if (trimmedLine.startsWith('#')) {
            // Check for block opening statements
            if (/^#(define-long|append-long|procedure|foreach|if|elseif|else|ifdef|ifndef)\b/.test(trimmedLine)) {
                formattedLines.push(currentIndent + trimmedLine);
                indentStack.push(currentIndent);
                currentIndent += '    '; // Add 4 spaces for indentation
            }
            // Check for block closing statements
            else if (/^#(end-define|end-append|endproc|endfor|endif)\b/.test(trimmedLine)) {
                if (indentStack.length > 0) {
                    currentIndent = indentStack.pop()!;
                }
                formattedLines.push(currentIndent + trimmedLine);
            }
            // Regular Hotmeal statement
            else {
                formattedLines.push(currentIndent + trimmedLine);
            }
        }
        // HTML content
        else {
            formattedLines.push(currentIndent + trimmedLine);
        }
    }
    
    return formattedLines.join('\n');
}

export function deactivate() {}
