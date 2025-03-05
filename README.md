# Hotmeal Language Support for Visual Studio Code

This extension provides syntax highlighting and formatting support for the Hotmeal programming language.

## Features

- Syntax highlighting for Hotmeal statements and embedded HTML
- Code folding for block statements
- Formatting support
- Bracket matching
- Code snippets for common Hotmeal constructs

## Hotmeal Language

Hotmeal is a preprocessor-style language embedded in HTML. Lines starting with `#` are interpreted as Hotmeal statements, while other lines are treated as HTML.

### Key Language Features

- Variable definitions and substitutions
- Control structures (if/else, foreach)
- Procedures and procedure calls
- Database operations
- String operations
- File operations
- HTTP operations

## Usage

Once installed, the extension will automatically activate for files with `.html` extension and provide syntax highlighting for Hotmeal statements.

To format a Hotmeal document:
- Open Command Palette (Ctrl+Shift+P)
- Search for "Format Document" or use the keyboard shortcut (usually Alt+Shift+F)

## Examples

```hotmeal
#define __variable__ "My Variable"

<html>
  <head>
    <title>Hotmeal Example</title>
  </head>
  <body>
    <h1>Hello, _##__variable__##_!</h1>
    
    #if __client_os__ == "windows"
      <p>You're using Windows</p>
    #elseif __client_os__ == "macosx"
      <p>You're using macOS</p>
    #else
      <p>You're using another operating system</p>
    #endif
  </body>
</html>
