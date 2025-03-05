"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
function activate(context) {
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
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
            editBuilder.replace(fullRange, formatted);
        });
    });
    context.subscriptions.push(disposable);
    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider('hotmeal', {
        provideCompletionItems(document, position) {
            const variables = collectVariablesFromDocument(document);
            return variables.map(varName => {
                const item = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
                item.detail = 'Hotmeal Variable';
                return item;
            });
        }
    });
    context.subscriptions.push(completionProvider);
    // Register hover provider
    const hoverProvider = vscode.languages.registerHoverProvider('hotmeal', {
        provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            if (!range)
                return;
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
    });
    context.subscriptions.push(hoverProvider);
    // Register diagnostic updates
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'hotmeal') {
            updateDiagnostics(event.document, diagnosticsCollection);
        }
    }));
    // Register a formatter provider
    vscode.languages.registerDocumentFormattingEditProvider('hotmeal', {
        provideDocumentFormattingEdits(document) {
            const text = document.getText();
            const formatted = formatHotmeal(text);
            const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
            return [vscode.TextEdit.replace(fullRange, formatted)];
        }
    });
}
exports.activate = activate;
function formatHotmeal(text) {
    // Split the document into lines
    const lines = text.split(/\r?\n/);
    const formattedLines = [];
    // Stack to keep track of indentation level
    const indentStack = [];
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
                    currentIndent = indentStack.pop();
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
function collectVariablesFromDocument(document) {
    const variables = new Set();
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
function addPredefinedVariables(variables) {
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
function getHotmealStatementDocs(statement) {
    const docsMap = {
        'define': 'Defines a variable.\n\n```\n#define VarName VarValue\n```\n\nAssign VarName with string value from VarValue.',
        'define-long': 'Starts a multi-line variable definition.\n\n```\n#define-long VarName\n...\n#end-define\n```',
        'procedure': 'Defines a procedure.\n\n```\n#procedure ProcName(Param1, [out] Param2)\n...\n#endproc\n```',
        'foreach': 'Loops through elements in a list.\n\n```\n#foreach VarName ListString\n...\n#endfor\n```',
        'if': 'Conditional statement.\n\n```\n#if Condition\n...\n[#else]\n...\n#endif\n```'
    };
    return docsMap[statement] ? new vscode.MarkdownString(docsMap[statement]) : undefined;
}
function updateDiagnostics(document, collection) {
    const diagnostics = [];
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const blockStack = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (/#\s*(define-long|append-long|procedure|foreach|if|ifdef|ifndef)\b/.test(line)) {
            const statement = line.split(/\s+/)[0].substring(1);
            blockStack.push({ statement, line: i });
        }
        else if (/#\s*(end-define|end-append|endproc|endfor|endif)\b/.test(line)) {
            const statement = line.split(/\s+/)[0].substring(1);
            const expectedClosing = getExpectedClosing(blockStack.pop()?.statement);
            if (!expectedClosing) {
                const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, line.length));
                diagnostics.push(new vscode.Diagnostic(range, `Unexpected closing statement ${statement}`, vscode.DiagnosticSeverity.Error));
            }
            else if (statement !== expectedClosing) {
                const range = new vscode.Range(new vscode.Position(i, 0), new vscode.Position(i, line.length));
                diagnostics.push(new vscode.Diagnostic(range, `Expected ${expectedClosing} but found ${statement}`, vscode.DiagnosticSeverity.Error));
            }
        }
    }
    for (const block of blockStack) {
        const range = new vscode.Range(new vscode.Position(block.line, 0), new vscode.Position(block.line, lines[block.line].length));
        diagnostics.push(new vscode.Diagnostic(range, `Unclosed ${block.statement} block`, vscode.DiagnosticSeverity.Error));
    }
    collection.set(document.uri, diagnostics);
}
function getExpectedClosing(statement) {
    if (!statement)
        return undefined;
    const closingMap = {
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
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map