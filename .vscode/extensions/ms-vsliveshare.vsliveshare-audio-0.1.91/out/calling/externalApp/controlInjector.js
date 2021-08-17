"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("./constants");
const traceSource_1 = require("../../tracing/traceSource");
// The control injector should only be loaded on Electron's main process.
// The renderer process doesn't have a UI message pump which leads to
// deadlocks & control pointer issues.
class ControlInjectorWrapper {
    constructor(injector, ipcMain) {
        this.injector = injector;
        this.ipcMain = ipcMain;
        this.logPrefix = `[ControlInjectorWrapper]`;
        this.initialize();
    }
    initialize() {
        this.ipcMain.on(constants_1.ElectronChannels.setInjectorConfig, (event, config) => this.invokeInjectorCommand(constants_1.ElectronChannels.setInjectorConfig, () => this.injector.setInjectorConfig(config)));
        this.ipcMain.on(constants_1.ElectronChannels.injectRawInput, (event, buffer, sourceId) => this.invokeInjectorCommand(constants_1.ElectronChannels.injectRawInput, () => this.injector.injectRawInput(buffer, sourceId)));
        this.ipcMain.on(constants_1.ElectronChannels.setInjectionRect, (event, rect) => this.invokeInjectorCommand(constants_1.ElectronChannels.setInjectionRect, () => this.injector.setInjectionRect(rect)));
        this.ipcMain.on(constants_1.ElectronChannels.allowSingleController, (event, sourceId) => this.invokeInjectorCommand(constants_1.ElectronChannels.allowSingleController, () => this.injector.allowSingleController(sourceId)));
        this.ipcMain.on(constants_1.ElectronChannels.setAvatar, (event, base64Buffer, sourceId) => this.invokeInjectorCommand(constants_1.ElectronChannels.setAvatar, () => this.injector.setAvatar(base64Buffer, sourceId)));
    }
    invokeInjectorCommand(channel, cmd) {
        if (this.injector) {
            try {
                traceSource_1.defaultTraceSource.info(`${this.logPrefix} ${channel}: start`);
                cmd();
                traceSource_1.defaultTraceSource.info(`${this.logPrefix} ${channel}: end`);
            }
            catch (e) {
                traceSource_1.defaultTraceSource.error(`${this.logPrefix} ${channel}: ${e}`);
            }
        }
    }
    dispose() {
        traceSource_1.defaultTraceSource.info(`${this.logPrefix} disposing`);
        if (this.injector) {
            this.injector.dispose();
            this.injector = null;
        }
    }
}
exports.ControlInjectorWrapper = ControlInjectorWrapper;
//# sourceMappingURL=controlInjector.js.map