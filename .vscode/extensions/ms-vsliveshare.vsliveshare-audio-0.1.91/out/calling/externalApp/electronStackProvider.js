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
const fs = require("fs");
const path = require("path");
const os = require("os");
const skype_calling_electron_1 = require("@skype/skype-calling-electron");
const callingUtils_1 = require("../callingUtils");
const traceSource_1 = require("../../tracing/traceSource");
const constants_1 = require("./constants");
const { ipcRenderer } = require('electron');
class AppLogger {
    constructor(trace) {
        this.trace = trace;
        this.logPrefix = `[AppLogger]`;
    }
    createChild(namespace, debug) {
        return this;
    }
    log(...values) {
        this.trace.info(`${this.logPrefix} log: ${traceSource_1.TraceFormat.formatMessage(values, this.trace)}`);
    }
    debug(...values) {
        this.trace.info(`${this.logPrefix} debug: ${traceSource_1.TraceFormat.formatMessage(values, this.trace)}`);
    }
    info(...values) {
        this.trace.info(`${this.logPrefix} info: ${traceSource_1.TraceFormat.formatMessage(values, this.trace)}`);
    }
    warn(...values) {
        this.trace.warning(`${this.logPrefix} warn: ${traceSource_1.TraceFormat.formatMessage(values, this.trace)}`);
    }
    error(...values) {
        this.trace.error(`${this.logPrefix} error: ${traceSource_1.TraceFormat.formatMessage(values, this.trace)}`);
    }
}
class ControlInjectorProxy {
    constructor(trace) {
        this.trace = trace;
        this.logPrefix = `[ControlInjectorProxy]`;
    }
    setInjectorConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invokeInjectorCommand(constants_1.ElectronChannels.setInjectorConfig, () => ipcRenderer.send(constants_1.ElectronChannels.setInjectorConfig, config));
        });
    }
    injectRawInput(buffer, sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invokeInjectorCommand(constants_1.ElectronChannels.injectRawInput, () => ipcRenderer.send(constants_1.ElectronChannels.injectRawInput, buffer, sourceId));
        });
    }
    setInjectionRect(rect) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invokeInjectorCommand(constants_1.ElectronChannels.setInjectionRect, () => ipcRenderer.send(constants_1.ElectronChannels.setInjectionRect, rect));
        });
    }
    allowSingleController(sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invokeInjectorCommand(constants_1.ElectronChannels.allowSingleController, () => ipcRenderer.send(constants_1.ElectronChannels.allowSingleController, sourceId));
        });
    }
    setAvatar(base64Buffer, sourceId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.invokeInjectorCommand(constants_1.ElectronChannels.setAvatar, () => ipcRenderer.send(constants_1.ElectronChannels.setAvatar, base64Buffer, sourceId));
        });
    }
    invokeInjectorCommand(channel, cmd) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info(`${this.logPrefix} Proxy ${channel}: start`);
            try {
                cmd();
            }
            catch (e) {
                this.trace.error(e);
            }
            this.trace.info(`${this.logPrefix} Proxy ${channel}: end`);
        });
    }
    dispose() { }
}
class AppHooks {
    constructor(trace) {
        this.trace = trace;
        this.logPrefix = `[AppHooks]`;
        const platform = window.process.platform;
        this.trace.info(`${this.logPrefix} Create control injector instance. Platform: ${platform}`);
        let instance;
        switch (platform) {
            case 'freebsd':
            case 'linux':
                // Use a default control injector
                // (sharing-indicator.node isn't available on this platform)
                instance = {
                    setInjectorConfig: (config) => Promise.resolve(),
                    injectRawInput: (buffer, sourceId) => Promise.resolve(),
                    setInjectionRect: (rect) => Promise.resolve(),
                    allowSingleController: (sourceId) => Promise.resolve(),
                    setAvatar: (base64Buffer, sourceId) => Promise.resolve(),
                    dispose: () => { }
                };
                break;
            case 'darwin':
            case 'win32':
            default:
                // Use a proxy to the control injector (obtained from sharing-indicator.node)
                // that is loaded on Electron's main process.
                instance = new ControlInjectorProxy(this.trace);
                break;
        }
        this.controlInjector = instance;
    }
    onDisplaysChanged(callback) {
        return { dispose: () => { } };
    }
    showSharingIndicator(regionOrWindowId) {
    }
    hideSharingIndicator() {
    }
    getControlInjector() {
        this.trace.info(`${this.logPrefix} getcontrolinjector: ${this.controlInjector}`);
        return this.controlInjector;
    }
}
class ElectronStackProvider {
    constructor(trace) {
        this.trace = trace;
        this.logPrefix = `[ElectronStackProvider]`;
    }
    build() {
        const platformId = callingUtils_1.PLATFORMS[`${window.process.platform}-${window.process.arch}`];
        this.trace.info(`${this.logPrefix} PlatformId: ${platformId}`);
        if (!platformId) {
            throw new Error(`Platform ${window.process.platform}-${window.process.arch} not supported`);
        }
        // Use the default Live Share log directory for slimcore logging
        // If the temp directory doesn't exist the slimcore
        // native process will terminate unexpectedly
        const tempDir = path.join(os.tmpdir(), constants_1.logDirectoryName);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        this.trace.info(`${this.logPrefix} temp slimcore directory: ${traceSource_1.TraceFormat.formatPath(tempDir, this.trace)}`);
        const slimCoreSettings = {
            dataPath: tempDir,
            mediaLogsPath: tempDir,
            logFileName: 'logger',
            version: `${platformId}/${callingUtils_1.getNormalizedVersion()}//`,
            isEncrypted: false
        };
        this.trace.info(`${this.logPrefix} creating slimcore instance`);
        this.slimCoreInstance = global.SlimCore.createSlimCoreInstance(slimCoreSettings);
        this.trace.info(`${this.logPrefix} ${this.slimCoreInstance}`);
        this.config = {
            appHooks: new AppHooks(this.trace),
            logger: new AppLogger(this.trace),
            settings: {
                enableDXVA: false,
                autoStopLocalVideo: false
            },
            slimCoreInstance: this.slimCoreInstance
        };
        return skype_calling_electron_1.slimCoreElectronStackFactory.build(this.config);
    }
    dispose() {
        if (this.slimCoreInstance) {
            this.slimCoreInstance.dispose();
            this.slimCoreInstance = null;
        }
        global.SlimCore = null;
        global.Enums = null;
    }
}
exports.ElectronStackProvider = ElectronStackProvider;
//# sourceMappingURL=electronStackProvider.js.map