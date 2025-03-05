import * as vscode from 'vscode';

async function activateHtmlAndJavaScript(context: vscode.ExtensionContext) {
    try {
        // Get the HTML extension
        const htmlExtension = vscode.extensions.getExtension('vscode.html-language-features');
        if (htmlExtension) {
            if (!htmlExtension.isActive) {
                await htmlExtension.activate();
            }
            
            // Register providers that delegate to HTML providers
            const documentSelector = [
                { language: 'hotmeal', scheme: 'file' },
                { language: 'hotmeal', scheme: 'untitled' }
            ];
            
            // Completion provider that delegates to HTML
            const completionProvider = vscode.languages.registerCompletionItemProvider(
                documentSelector,
                {
                    async provideCompletionItems(document, position, token, context) {
                        const line = document.lineAt(position.line);
                        
                        // If this is a Hotmeal directive line, don't provide HTML completions
                        if (line.text.trimLeft().startsWith('#')) {
                            return null;
                        }
                        
                        // Otherwise delegate to HTML provider
                        return vscode.commands.executeCommand<vscode.CompletionList>(
                            'vscode.executeCompletionItemProvider',
                            document.uri,
                            position,
                            context.triggerCharacter
                        );
                    }
                },
                '<', '!', '/'  // Trigger on these characters
            );
            
            // Hover provider that delegates to HTML
            const hoverProvider = vscode.languages.registerHoverProvider(
                documentSelector,
                {
                    async provideHover(document, position, token) {
                        const line = document.lineAt(position.line);
                        
                        // If this is a Hotmeal directive line, don't provide HTML hover
                        if (line.text.trimLeft().startsWith('#')) {
                            return null;
                        }
                        
                        // Otherwise delegate to HTML hover provider
                        return vscode.commands.executeCommand<vscode.Hover[]>(
                            'vscode.executeHoverProvider',
                            document.uri,
                            position
                        ).then(hovers => hovers?.length ? hovers[0] : null);
                    }
                }
            );
            
            context.subscriptions.push(completionProvider, hoverProvider);
        }
        
        // Same for JavaScript
        const jsExtension = vscode.extensions.getExtension('vscode.typescript-language-features');
        if (jsExtension) {
            if (!jsExtension.isActive) {
                await jsExtension.activate();
            }
        }
    } catch (error) {
        console.error('Error activating HTML/JavaScript support:', error);
    }
}

export async function activate(context: vscode.ExtensionContext) {
    // Activate HTML and JavaScript support
    await activateHtmlAndJavaScript(context);

    // Create diagnostics collection
    const diagnosticsCollection = vscode.languages.createDiagnosticCollection('hotmeal');
    context.subscriptions.push(diagnosticsCollection);

    // Configure HTML language features
    vscode.languages.setLanguageConfiguration('hotmeal', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        onEnterRules: [
            {
                beforeText: /^\s*<(?!\/)[^>]*>$/,
                afterText: /^<\/[^>]+>$/,
                action: { indentAction: vscode.IndentAction.IndentOutdent }
            },
            {
                beforeText: /^\s*<(?!\/)[^>]*>$/,
                action: { indentAction: vscode.IndentAction.Indent }
            }
        ]
    });

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

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        'hotmeal',
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const variables = collectVariablesFromDocument(document);
                return variables.map(varName => {
                    const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
                    item.detail = 'Hotmeal Variable';
                    return item;
                });
            }
        }
    );
    context.subscriptions.push(completionProvider);

    // Register Hotmeal directive completion provider
    const directiveCompletionProvider = vscode.languages.registerCompletionItemProvider(
        'hotmeal',
        {
            provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
                const linePrefix = document.lineAt(position).text.slice(0, position.character);
                
                // Only provide completions for lines starting with #
                if (!linePrefix.trimLeft().startsWith('#')) {
                    return undefined;
                }
                
                // Create completions for Hotmeal directives
                const directives = [
                    'define', 'define-long', 'append', 'append-long', 'end-define', 'end-append',
                    'procedure', 'endproc', 'call',
                    'if', 'elseif', 'else', 'endif', 'ifdef', 'ifndef',
                    'foreach', 'endfor', 'break',
                    'db-row-format', 'db-row-format-last', 'db-select', 'db-execute',
                    'md5-hash', 'curr-datetime', 'str-eval', 'str-replace', 'str-split',
                    'str-break', 'str-trim', 'str-mask', 'str-tolower', 'str-toupper',
                    'math', 'add', 'sub', 'mul', 'div',
                    'mkdir', 'read-file', 'write-file', 'append-file',
                    'parse-uri', 'parse-cookies', 'set-cookie', 'parse-form', 'get-body',
                    'include', 'include-once', 'redirect', 'forward', 'http-call',
                    'return', 'eof'
                ];
                
                return directives.map(directive => {
                    const item = new vscode.CompletionItem(directive, vscode.CompletionItemKind.Keyword);
                    item.detail = 'Hotmeal directive';
                    item.documentation = getHotmealStatementDocs(directive) || new vscode.MarkdownString(`#${directive}`);
                    return item;
                });
            }
        },
        '#' // Trigger on # character
    );
    context.subscriptions.push(directiveCompletionProvider);

    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider(
        'hotmeal',
        {
            provideHover(document, position, token) {
                const range = document.getWordRangeAtPosition(position);
                if (!range) return;
                
                const word = document.getText(range);
                const lineText = document.lineAt(position.line).text;
                
                if (lineText.trim().startsWith('#')) {
                    const statement = lineText.trim().split(/\s+/)[0].substring(1);
                    const documentation = getHotmealStatementDocs(statement);
                    if (documentation) {
                        return new vscode.Hover(documentation);
                    }
                }
                
                if (word.startsWith('__') && word.endsWith('__')) {
                    return new vscode.Hover('Hotmeal Variable: ' + word);
                }
            }
        }
    );
    context.subscriptions.push(hoverProvider);

    // Register diagnostic updates
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'hotmeal') {
                updateDiagnostics(event.document, diagnosticsCollection);
            }
        })
    );

    // Register HTML auto-tag closing
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            'hotmeal',
            {
                provideCompletionItems(document, position) {
                    const text = document.getText(new vscode.Range(
                        new vscode.Position(position.line, 0),
                        position
                    ));
                    
                    // Check if we're typing an HTML tag
                    const tagMatch = text.match(/<(\w+)$/);
                    if (tagMatch) {
                        const tagName = tagMatch[1];
                        const item = new vscode.CompletionItem(tagName, vscode.CompletionItemKind.Snippet);
                        item.insertText = new vscode.SnippetString(`${tagName}>$1</${tagName}>`);
                        return [item];
                    }
                    return undefined;
                }
            },
            '>' // Trigger completion when > is typed
        )
    );

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

    // Register HTML content provider
    const htmlDocumentProvider = {
        provideTextDocumentContent(uri: vscode.Uri): string {
            // Find the document with the same path but different scheme
            const originalUri = uri.with({ scheme: 'file' });
            const document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === originalUri.fsPath);
            return document ? document.getText() : '';
        }
    };

    context.subscriptions.push(
        vscode.workspace.registerTextDocumentContentProvider('hotmeal-html', htmlDocumentProvider)
    );
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

// Helper functions for variable collection
function collectVariablesFromDocument(document: vscode.TextDocument): string[] {
    const variables = new Set<string>();
    const text = document.getText();
    
    // Match #define statements
    const defineRegex = /#\s*(define|define-long|append|append-long)\s+(__[a-zA-Z0-9_]+__)/g;
    let match;
    
    while ((match = defineRegex.exec(text)) !== null) {
        variables.add(match[2]);
    }
    
    // Collect procedure parameters
    const procRegex = /#\s*procedure\s+\w+\s*\(\s*([^)]+)\)/g;
    while ((match = procRegex.exec(text)) !== null) {
        const params = match[1].split(',');
        for (const param of params) {
            const trimmed = param.trim();
            if (trimmed.startsWith('__') && trimmed.endsWith('__')) {
                variables.add(trimmed);
            }
            else if (trimmed.startsWith('out ')) {
                const outParam = trimmed.substring(4).trim();
                if (outParam.startsWith('__') && outParam.endsWith('__')) {
                    variables.add(outParam);
                }
            }
        }
    }
    
    // Add pre-defined variables
    addPredefinedVariables(variables);
    
    return Array.from(variables);
}

function addPredefinedVariables(variables: Set<string>): void {
    const predefined = [
        '__client_browser__', '__client_browser_ver__', '__client_os__',
        '__client_os_ver__', '__client_size__', '__client_ip_addr__',
        '__client_lang__', '__client_auth_userid__', '__client_blocked__',
        '__client_descr__', '__date_time__', '__time_now__', '__time_curr__',
        '__time_minute__', '__time_hour__', '__date_day__', '__date_month__',
        '__date_year__', '__date_dow__'
    ];
    predefined.forEach(v => variables.add(v));
}

function getHotmealStatementDocs(statement: string): vscode.MarkdownString | undefined {
    const docsMap: {[key: string]: string} = {
        'define': 'Defines a variable.\n\n```\n#define VarName VarValue\n```\n\nAssign VarName with string value from VarValue.',
        'define-long': 'Starts a multi-line variable definition.\n\n```\n#define-long VarName\n...\n#end-define\n```',
        'append': 'Append to a variable.\n\n```\n#append VarName VarValue\n```',
        'append-long': 'Starts a multi-line variable append.\n\n```\n#append-long VarName\n...\n#end-append\n```',
        'procedure': 'Defines a procedure.\n\n```\n#procedure ProcName(Param1, [out] Param2)\n...\n#endproc\n```',
        'call': 'Call a procedure.\n\n```\n#call ProcName(Param1, Param2)\n```',
        'foreach': 'Loops through elements in a list.\n\n```\n#foreach VarName ListString\n...\n#endfor\n```',
        'if': 'Conditional statement.\n\n```\n#if Condition\n...\n[#else]\n...\n#endif\n```',
        'elseif': 'Else-if branch in conditional.\n\n```\n#elseif Condition\n```',
        'else': 'Else branch in conditional.\n\n```\n#else\n```',
        'ifdef': 'If variable defined.\n\n```\n#ifdef VarName\n...\n#endif\n```',
        'ifndef': 'If variable not defined.\n\n```\n#ifndef VarName\n...\n#endif\n```',
        'db-select': 'Execute SQL SELECT statement.\n\n```\n#db-select "SQL Statement"\n```',
        'db-execute': 'Execute SQL statement (INSERT/UPDATE/DELETE).\n\n```\n#db-execute "SQL Statement"\n```',
        'include': 'Include another file.\n\n```\n#include FilePath\n```',
        'include-once': 'Include another file only if not already included.\n\n```\n#include-once FilePath\n```',
        'return': 'Return from procedure or end response.\n\n```\n#return\n```',
        'break': 'Break out of a foreach loop.\n\n```\n#break\n```'
    };
    return docsMap[statement] ? new vscode.MarkdownString(docsMap[statement]) : undefined;
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const blockStack: {statement: string, line: number}[] = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (/#\s*(define-long|append-long|procedure|foreach|if|ifdef|ifndef)\b/.test(line)) {
            const statement = line.split(/\s+/)[0].substring(1);
            blockStack.push({statement, line: i});
        }
        else if (/#\s*(end-define|end-append|endproc|endfor|endif)\b/.test(line)) {
            const statement = line.split(/\s+/)[0].substring(1);
            const expectedClosing = getExpectedClosing(blockStack.pop()?.statement);
            
            if (!expectedClosing) {
                const range = new vscode.Range(
                    new vscode.Position(i, 0),
                    new vscode.Position(i, line.length)
                );
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Unexpected closing statement ${statement}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
            else if (statement !== expectedClosing) {
                const range = new vscode.Range(
                    new vscode.Position(i, 0),
                    new vscode.Position(i, line.length)
                );
                diagnostics.push(new vscode.Diagnostic(
                    range,
                    `Expected ${expectedClosing} but found ${statement}`,
                    vscode.DiagnosticSeverity.Error
                ));
            }
        }
    }
    
    for (const block of blockStack) {
        const range = new vscode.Range(
            new vscode.Position(block.line, 0),
            new vscode.Position(block.line, lines[block.line].length)
        );
        diagnostics.push(new vscode.Diagnostic(
            range,
            `Unclosed ${block.statement} block`,
            vscode.DiagnosticSeverity.Error
        ));
    }
    
    collection.set(document.uri, diagnostics);
}

function getExpectedClosing(statement?: string): string | undefined {
    if (!statement) return undefined;
    
    const closingMap: {[key: string]: string} = {
        'define-long': 'end-define',
        'append-long': 'end-append',
        'procedure': 'endproc',
        'foreach': 'endfor',
        'if': 'endif',
        'ifdef': 'endif',
        'ifndef': 'endif'
    };
    
    return closingMap[statement];
}

export function deactivate() {}
