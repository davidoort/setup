"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const UmletEditorProvider_1 = require("./UmletEditorProvider");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    createUmletCommands(context);
    console.log("activating umlet extension...");
    UmletEditorProvider_1.UmletEditorProvider.overrideVsCodeCommands(context);
    context.subscriptions.push(vscode.window.registerCustomEditorProvider("uxfCustoms.umletEditor", new UmletEditorProvider_1.UmletEditorProvider(context), {
        webviewOptions: { retainContextWhenHidden: true }
    }));
}
exports.activate = activate;
function createUmletCommands(context) {
    //Register Commands for exporting in default and x4 size
    //x1 Size
    const commandHandlerExportPng = () => {
        UmletEditorProvider_1.exportCurrentlyActivePanel === null || UmletEditorProvider_1.exportCurrentlyActivePanel === void 0 ? void 0 : UmletEditorProvider_1.exportCurrentlyActivePanel.webview.postMessage({
            command: 'requestExportPng',
            text: vscode_1.workspace.getConfiguration('umlet').get('exportScale')
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.exportPng', commandHandlerExportPng));
    const commandHandlerExportPdf = () => {
        UmletEditorProvider_1.exportCurrentlyActivePanel === null || UmletEditorProvider_1.exportCurrentlyActivePanel === void 0 ? void 0 : UmletEditorProvider_1.exportCurrentlyActivePanel.webview.postMessage({
            command: 'requestExportPdf'
        });
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.exportPdf', commandHandlerExportPdf));
    //create a new file and open it in editor
    const commandHandlerCreateNewDiagram = () => {
        let folderPath = vscode.workspace.rootPath;
        if (folderPath === undefined) {
            vscode.window.showErrorMessage("Unable to create new .uxf file, since there is currently no folder/workspace opened. Please open a folder/workspace and try again!");
            return;
        }
        let fileName = "Diagram " + getCurrentDateTimeString() + ".uxf";
        let completePath = path.join(folderPath, fileName);
        fs.writeFile(completePath, "", function (err) {
            if (err) {
                return console.log(err);
            }
        });
        let url = vscode_1.Uri.file(completePath);
        /*
          note: this does not guarantee the new file is opened with UMLet, but currently there does not seem to be an option to tell vscode to open a file with a certain editor.
          VSCode prefers Custom Editors over its built-in editors, but especially if the extention is not fully loaded yet, vscode might open this file as plaintext.
          To prevent this case "onStartupFinished" is a startup event for umlet, so the probability that the umlet extension is not loaded when a user calls the command is greatly reduced.
          if other .uxf extensions are installed, vscode might not open the newly created file with UMLet as well, and has to be manually reopened in UMLet
        */
        vscode.commands.executeCommand('vscode.open', url);
    };
    context.subscriptions.push(vscode.commands.registerCommand('umlet.createNewDiagram', commandHandlerCreateNewDiagram));
    function getCurrentDateTimeString() {
        let today = new Date();
        let dd = String(today.getDate()).padStart(2, '0');
        let mm = String(today.getMonth() + 1).padStart(2, '0');
        let yyyy = today.getFullYear();
        let hh = String(today.getHours()).padStart(2, '0');
        let mins = String(today.getMinutes()).padStart(2, '0');
        let ss = String(today.getSeconds()).padStart(2, '0');
        return ("" + yyyy + "-" + mm + "-" + dd + " " + hh + "-" + mins + "-" + ss);
    }
}
//# sourceMappingURL=extension.js.map