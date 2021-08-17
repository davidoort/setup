"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const controlInjector_1 = require("./controlInjector");
const constants_1 = require("./constants");
const traceSource_1 = require("../../tracing/traceSource");
const logFileTraceListener_1 = require("../../tracing/logFileTraceListener");
const common_1 = require("./common");
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
// Set up control injector on the main Electron process
const startOptions = common_1.getStartOptions(process.argv[2]);
const dynamicLoader = require('dynamicloader');
const sharingIndicatorPath = path.join(startOptions.slimCorePath, 'lib/sharing-indicator');
const sharingIndicator = dynamicLoader.load(sharingIndicatorPath);
// The control injector is not currently available on all platforms (ex: linux)
let injectorWrapper;
if (sharingIndicator && sharingIndicator.ControlInjector) {
    const tempDir = path.join(os.tmpdir(), constants_1.logDirectoryName);
    const controlInjector = new sharingIndicator.ControlInjector(tempDir);
    injectorWrapper = new controlInjector_1.ControlInjectorWrapper(controlInjector, ipcMain);
}
// Check if dev tools are enabled
const isDevToolsEnabled = startOptions.isDevToolsEnabled;
let win;
app.commandLine.appendSwitch('ignore-gpu-blacklist');
if (app.dock) {
    app.dock.hide();
}
app.on('ready', () => __awaiter(this, void 0, void 0, function* () {
    const logFileTraceListener = new logFileTraceListener_1.LogFileTraceListener('VSLSAudio_ElectronMainProcess');
    yield logFileTraceListener.openAsync();
    traceSource_1.defaultTraceSource.addTraceListener(logFileTraceListener);
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Live Share',
        frame: false,
        show: false,
        icon: path.join(__dirname, 'LiveShare.png'),
        skipTaskbar: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });
    win.setMenu(null);
    win.loadURL(`file://${__dirname}/index.html`);
    win.hide();
    // For debugging:
    if (isDevToolsEnabled) {
        win.webContents.openDevTools();
    }
    globalShortcut.register('CommandOrControl+Shift+K', () => {
        win.webContents.openDevTools();
    });
}));
ipcMain.on(constants_1.ElectronChannels.quit, (evt, arg) => {
    if (injectorWrapper) {
        injectorWrapper.dispose();
    }
    app.quit();
});
//# sourceMappingURL=main.js.map