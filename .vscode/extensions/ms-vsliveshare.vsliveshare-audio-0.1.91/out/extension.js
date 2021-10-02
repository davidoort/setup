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
const vscode = require("vscode");
const app_1 = require("./app");
const vsls = require("vsls/vscode");
const extensionutil_1 = require("./extensionutil");
const traceSource_1 = require("./tracing/traceSource");
const telemetry_1 = require("./telemetry/telemetry");
const telemetryStrings_1 = require("./telemetry/telemetryStrings");
const downloader_1 = require("./downloader");
const externalAppCallingService_1 = require("./calling/externalAppCallingService");
const constants_1 = require("./constants");
const { displayName } = require('../package.json');
let app = null;
let callingService = null;
var InstallRecoverySource;
(function (InstallRecoverySource) {
    InstallRecoverySource[InstallRecoverySource["Command"] = 0] = "Command";
    InstallRecoverySource[InstallRecoverySource["Initialize"] = 1] = "Initialize";
    InstallRecoverySource[InstallRecoverySource["Installation"] = 2] = "Installation";
})(InstallRecoverySource = exports.InstallRecoverySource || (exports.InstallRecoverySource = {}));
function activate(context) {
    return __awaiter(this, void 0, void 0, function* () {
        let activationEvent = telemetry_1.Telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.ACTIVATE_EXTENSION);
        context.subscriptions.push(telemetry_1.Telemetry.reporter);
        try {
            yield extensionutil_1.ExtensionUtil.Init(context);
            let liveShare = yield vsls.getApiAsync();
            if (!liveShare) {
                vscode.window.showInformationMessage('VS LiveShare Audio extension requires VS Live Share extension to be installed. Please install VS Live Share extension or update to latest');
                return false;
            }
            context.subscriptions.push(extensionutil_1.ExtensionUtil.registerCommand(constants_1.INSTALLATION_RECOVERY_COMMAND, (source) => installationRecovery(source || InstallRecoverySource.Command)));
            const liveShareExtension = vscode.extensions.getExtension('ms-vsliveshare.vsliveshare-audio');
            const installationResult = yield downloader_1.ExternalDownloader.ensureRuntimeDependenciesAsync(liveShareExtension);
            // failed to install dependecies
            if (installationResult === downloader_1.EnsureRuntimeDependenciesResult.Failure) {
                activationEvent.end(telemetry_1.TelemetryResult.UserFailure, 'Extension activation failed - download runtime dependencies.');
                traceSource_1.defaultTraceSource.error(`${displayName} was unable to download needed dependencies to finish installation.`);
                yield installationRecovery(InstallRecoverySource.Installation);
                return;
            }
            callingService = new externalAppCallingService_1.ExternalAppCallingService(liveShare, true);
            app = new app_1.App(context, liveShare, callingService);
        }
        catch (e) {
            const telemetryMessage = 'Extension activation failed. ' + e.message;
            activationEvent.end(telemetry_1.TelemetryResult.Failure, telemetryMessage);
            telemetry_1.Telemetry.sendActivateExtensionFault(telemetry_1.FaultType.Error, telemetryMessage, e, activationEvent);
            throw e;
        }
        activationEvent.end(telemetry_1.TelemetryResult.Success, 'Extension activation success.');
        return callingService;
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        let deactivateEvent = telemetry_1.Telemetry.startTimedEvent(telemetryStrings_1.TelemetryEventNames.DEACTIVATE_EXTENSION);
        try {
            traceSource_1.defaultTraceSource.info(`Deactivating extension`);
            yield new Promise((resolve, reject) => {
                setTimeout(() => {
                    traceSource_1.defaultTraceSource.info('Extension deactivation complete');
                    resolve();
                }, 5000);
                app.dispose();
            });
        }
        catch (e) {
            const telemetryMessage = 'Extension deactivation failed. ' + e.message;
            deactivateEvent.end(telemetry_1.TelemetryResult.Failure, telemetryMessage);
            telemetry_1.Telemetry.sendDeactivateExtensionFault(telemetry_1.FaultType.Error, telemetryMessage, e, deactivateEvent);
            throw e;
        }
        deactivateEvent.end(telemetry_1.TelemetryResult.Success, 'Extension deactivation success.');
    });
}
exports.deactivate = deactivate;
function installationRecovery(source) {
    return __awaiter(this, void 0, void 0, function* () {
        traceSource_1.defaultTraceSource.info('Installation recovery started');
        const installRecoveryAction = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.INSTALL_RECOVERY);
        installRecoveryAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.INSTALL_RECOVERY_SOURCE, source);
        const buttonText = 'Repair';
        const repairButton = { id: 1, title: buttonText };
        let buttons = [repairButton];
        let isError;
        let messagePrefix;
        switch (source) {
            case InstallRecoverySource.Initialize:
                isError = true;
                messagePrefix = 'Live Share Audio failed to start due to a corrupted download.';
                break;
            case InstallRecoverySource.Installation:
                isError = true;
                messagePrefix = 'Live Share Audio was unable to download needed dependencies to finish installation.';
                break;
            case InstallRecoverySource.Command:
            default:
                isError = false;
                messagePrefix = 'Having trouble with your Live Share Audio installation?';
                break;
        }
        const message = `${messagePrefix} Ensure you have network connectivity then click \`Repair\` to restart VS Code and attempt recovery.`;
        let result;
        yield extensionutil_1.ExtensionUtil.runWithProgress(() => __awaiter(this, void 0, void 0, function* () {
            result = isError ? yield vscode.window.showErrorMessage(message, ...buttons) :
                yield vscode.window.showWarningMessage(message, ...buttons);
        }), 'Repairing installation...');
        const installRecoveryResult = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.INSTALL_RECOVERY_TOAST);
        installRecoveryResult.correlateWith(installRecoveryAction);
        const shouldRepair = !!result;
        installRecoveryResult.addProperty(telemetryStrings_1.TelemetryPropertyNames.INSTALL_RECOVERY_TOAST_RESULT, shouldRepair);
        installRecoveryResult.send();
        if (shouldRepair) {
            if (app) {
                try {
                    traceSource_1.defaultTraceSource.info('Dispose calling service');
                    yield app.dispose();
                }
                catch (e) {
                    // If the electron was running it will throw an error
                    traceSource_1.defaultTraceSource.error(`Error expected: ${e}`);
                }
            }
            traceSource_1.defaultTraceSource.info('Deleting runtime dependencies');
            yield downloader_1.ExternalDownloader.deleteRuntimeDependencies();
            installRecoveryAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.INSTALL_RECOVERY_RELOAD, true);
            installRecoveryAction.send();
            traceSource_1.defaultTraceSource.info('Reload window and reinstall dependencies');
            yield vscode.commands.executeCommand('workbench.action.reloadWindow');
            throw new Error('Unreachable code.');
        }
        traceSource_1.defaultTraceSource.info('Installation recovery canceled');
        installRecoveryAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.INSTALL_RECOVERY_CANCELED, true);
        installRecoveryAction.send();
    });
}
//# sourceMappingURL=extension.js.map