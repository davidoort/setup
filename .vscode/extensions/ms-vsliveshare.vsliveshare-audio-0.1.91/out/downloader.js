"use strict";
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
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
const semver = require("semver");
const traceSource_1 = require("./tracing/traceSource");
const packageManager_1 = require("./packageManager");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");
const telemetry_1 = require("./telemetry/telemetry");
const acquisitionTelemetry_1 = require("./telemetry/acquisitionTelemetry");
const lockFile = require("lockfile");
const extensionutil_1 = require("./extensionutil");
const telemetryStrings_1 = require("./telemetry/telemetryStrings");
const constants_1 = require("./constants");
const getInstallFilePath = () => path.resolve(extensionutil_1.ExtensionUtil.Context.extensionPath, 'install.Lock');
const getLockFilePath = () => path.resolve(extensionutil_1.ExtensionUtil.Context.extensionPath, 'externalDeps.Lock');
/**
 * Polls a predicate function until it either resolves `true`, or the max number of attempts is reached (resolves `false`).
 *
 * @param predicate A function that returns `true` if polling should complete
 * @param interval Polling interval (ms)
 * @param maxAttempts How many polling attempts should occur before giving up
 */
function poll(predicate, interval = 1000, maxAttempts = 1000) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            let count = 0;
            const intervalId = setInterval(() => {
                if (count > maxAttempts) {
                    resolve(false);
                }
                const result = predicate();
                if (result) {
                    clearInterval(intervalId);
                    resolve(true);
                }
                count++;
            }, interval);
        });
    });
}
var EnsureRuntimeDependenciesResult;
(function (EnsureRuntimeDependenciesResult) {
    EnsureRuntimeDependenciesResult[EnsureRuntimeDependenciesResult["Success"] = 0] = "Success";
    EnsureRuntimeDependenciesResult[EnsureRuntimeDependenciesResult["Failure"] = 1] = "Failure";
    EnsureRuntimeDependenciesResult[EnsureRuntimeDependenciesResult["AlreadyInstalled"] = 2] = "AlreadyInstalled";
})(EnsureRuntimeDependenciesResult = exports.EnsureRuntimeDependenciesResult || (exports.EnsureRuntimeDependenciesResult = {}));
/**
 * Class used to download the runtime dependencies
 */
class ExternalDownloader {
    constructor(packageJSON) {
        this.packageJSON = packageJSON;
    }
    static ensureRuntimeDependenciesAsync(extension) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield installFileExistsAsync())) {
                const downloader = new ExternalDownloader(extension.packageJSON);
                return yield extensionutil_1.ExtensionUtil.runWithProgressWithFeedback((progress) => { return downloader.installRuntimeDependenciesAsync(progress); }, { title: 'Downloading dependencies...' });
            }
            else {
                return EnsureRuntimeDependenciesResult.AlreadyInstalled;
            }
        });
    }
    installRuntimeDependenciesAsync(progress) {
        return __awaiter(this, void 0, void 0, function* () {
            const status = {
                setMessage: (text) => {
                    progress.report({ message: text });
                }
            };
            const lockOptions = {
                // Consider the lockfile stale if it was created before the last boot.
                stale: os.uptime() * 1000,
            };
            if (lockFile.checkSync(getLockFilePath(), lockOptions)) {
                traceSource_1.defaultTraceSource.error('Dependency lock file already exists');
                // Returning failure will prompt the user to repair the installation
                return EnsureRuntimeDependenciesResult.Failure;
            }
            else {
                lockFile.lockSync(getLockFilePath(), lockOptions);
                traceSource_1.defaultTraceSource.info('Installing dependencies for VSLS Audio...');
                let packageManager;
                let installationStage;
                let errorMessage = '';
                let result = EnsureRuntimeDependenciesResult.Failure;
                let telemetryEvent = telemetry_1.Telemetry.startTimedEvent(acquisitionTelemetry_1.AcquisitionTelemetryEventNames.ACQUIRE_DEPS, true);
                let platform;
                let architecture;
                try {
                    installationStage = 'getPlatformInfo';
                    platform = os.platform();
                    architecture = os.arch();
                    packageManager = new packageManager_1.PackageManager(platform, architecture, this.packageJSON);
                    installationStage = 'downloadPackages';
                    const workspaceConfig = vscode.workspace.getConfiguration();
                    yield packageManager.downloadPackagesAsync(status);
                    installationStage = 'installPackages';
                    yield packageManager.installPackagesAsync(status);
                    installationStage = 'installRuntimeExes';
                    installationStage = 'touchLockFile';
                    yield touchInstallFileAsync();
                    installationStage = 'completeSuccess';
                    result = EnsureRuntimeDependenciesResult.Success;
                }
                catch (error) {
                    if (error instanceof packageManager_1.PackageError) {
                        // we can log the message in a PackageError to telemetry as we do not put PII in PackageError messages
                        if (error.innerError) {
                            errorMessage = 'Dependency download failed. ' + error.innerError.toString();
                        }
                        else {
                            errorMessage = 'Dependency download failed. ' + error.message;
                        }
                        if (error.pkg) {
                            telemetryEvent.addProperty(acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.PACKAGE_URL, error.pkg.url);
                            telemetryEvent.addProperty(acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.PACKAGE_CODE, error.pkg.code);
                        }
                    }
                    else {
                        // do not log raw errorMessage in telemetry as it is likely to contain PII.
                        errorMessage = 'Dependency download failed. ' + error.toString();
                    }
                    telemetry_1.Telemetry.sendFault(acquisitionTelemetry_1.AcquisitionTelemetryEventNames.ACQUIRE_DEPS_FAULT, telemetry_1.FaultType.Unknown, errorMessage);
                    traceSource_1.defaultTraceSource.error(`Failed at stage: ${installationStage} - ${errorMessage}`);
                }
                finally {
                    this.sendDownloadTelemetry(telemetryEvent, installationStage, platform, architecture, (result === EnsureRuntimeDependenciesResult.Success), errorMessage);
                    this.sendPackageTelemetry(packageManager);
                    status.setMessage('');
                    lockFile.unlockSync(getLockFilePath());
                }
                return result;
            }
        });
    }
    static deleteRuntimeDependencies() {
        return __awaiter(this, void 0, void 0, function* () {
            const deletingDependenciesAction = new telemetry_1.TelemetryEvent(telemetryStrings_1.TelemetryEventNames.DELETE_RUNTIME_DEPENDENCIES);
            traceSource_1.defaultTraceSource.info('Delete runtime dependencies');
            try {
                const downloadLockFilePath = getLockFilePath();
                if (yield fs.pathExists(downloadLockFilePath)) {
                    traceSource_1.defaultTraceSource.info('Download lock file found. Deleting...');
                    deletingDependenciesAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.DELETE_DEPENDENCIES_DOWNLOAD_FILE, true);
                    yield fs.remove(downloadLockFilePath);
                }
                const installedLockFilePath = getInstallFilePath();
                if (yield fs.pathExists(installedLockFilePath)) {
                    traceSource_1.defaultTraceSource.info('Installed lock file found. Deleting...');
                    deletingDependenciesAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.DELETE_DEPENDENCIES_INSTALLED_FILE, true);
                    yield fs.remove(installedLockFilePath);
                }
                traceSource_1.defaultTraceSource.info('Clean electron install path');
                deletingDependenciesAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.DELETE_DEPENDENCIES_CLEAN_ELECTRON_INSTALL_PATH, true);
                const electronFullPath = extensionutil_1.ExtensionUtil.getElectronPath();
                const electronFolder = electronFullPath.substring(0, electronFullPath.lastIndexOf(constants_1.ELECTRON_DIST_FOLDER) + 4);
                yield packageManager_1.PackageManager.ensureCleanPath(electronFolder);
                traceSource_1.defaultTraceSource.info('Finished cleaning electron install path');
                traceSource_1.defaultTraceSource.info('Clean slimcore install path');
                deletingDependenciesAction.addProperty(telemetryStrings_1.TelemetryPropertyNames.DELETE_DEPENDENCIES_CLEAN_SLIMCORE_INSTALL_PATH, true);
                const slimcorePath = extensionutil_1.ExtensionUtil.getSlimCorePath();
                yield packageManager_1.PackageManager.ensureCleanPath(slimcorePath);
                traceSource_1.defaultTraceSource.info('Finished cleaning slimcore install path');
            }
            catch (e) {
                traceSource_1.defaultTraceSource.error(`Error deleting runtime dependencies: ${e}`);
                const deleteDependenciesFaultEvent = new telemetry_1.Fault(telemetryStrings_1.TelemetryEventNames.DELETE_DEPENDENCIES_FAULT, telemetry_1.FaultType.Error, 'Failed to delete dependencies', e);
                deleteDependenciesFaultEvent.correlateWith(deletingDependenciesAction);
                deleteDependenciesFaultEvent.addProperty(telemetryStrings_1.TelemetryPropertyNames.ERROR_CODE, e.code);
                deleteDependenciesFaultEvent.send();
            }
            deletingDependenciesAction.send();
        });
    }
    sendDownloadTelemetry(event, stage, platform, arch, success, errorMessage) {
        event.addProperty(acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.INSTALLATION_STAGE, stage);
        event.addProperty(acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.INSTALLATION_PLATFORM, platform);
        event.addProperty(acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.INSTALLATION_ARCH, arch);
        let message = success === true ? 'Dependency download success. ' : errorMessage;
        event.end(success === true ? telemetry_1.TelemetryResult.Success : telemetry_1.TelemetryResult.IndeterminateFailure, message);
    }
    sendPackageTelemetry(packageManager) {
        for (let key in packageManager.stats) {
            if (packageManager.stats.hasOwnProperty(key)) {
                const stats = packageManager.stats[key];
                const payload = {};
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.DID_DOWNLOAD, stats.didDownload);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.CHECKSUM_PASS, stats.checksumPass);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_PRE_UNPACK, stats.totalBaseFilesPreUnpack);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_POST_UNPACK, stats.totalBaseFilesPostUnpack);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_PRE_MOVE, stats.totalBaseFilesPreMove);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_POST_MOVE, stats.totalBaseFilesPostMove);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_FILES_EXTRACTED, stats.totalFilesExtracted);
                this.addPropertyIfExists(payload, acquisitionTelemetry_1.AcquisitionTelemetryPropertyNames.TOTAL_FILES_MOVED_OFFSET, stats.totalFileMovedOffset);
                telemetry_1.Telemetry.sendTelemetryEvent(acquisitionTelemetry_1.AcquisitionTelemetryEventNames.ACQUIRE_DEPS_PACKAGE, payload);
            }
        }
    }
    addPropertyIfExists(properties, propertyName, value) {
        if (value !== undefined) {
            properties[propertyName] = value.toString();
        }
    }
}
exports.ExternalDownloader = ExternalDownloader;
function installFileExistsAsync() {
    return new Promise((resolve, reject) => {
        fs.readFile(getInstallFilePath(), (err, data) => {
            if (err) {
                // The install.lock file does not exist. Dependencies are not installed.
                resolve(false);
                return;
            }
            // Read the VS Code version. If it's the same as current, or only a patch
            // version difference, then assume installed dependencies are all still good.
            const installedForVscodeVersion = data.toString().trim();
            if (semver.satisfies(vscode.version, '~' + installedForVscodeVersion)) {
                resolve(true);
                return;
            }
            // Dependencies were installed for a different VS Code version, so they need
            // to be re-checked. Remove the install.lock file.
            fs.unlink(getInstallFilePath(), (err) => {
                if (err)
                    reject(err);
                else
                    resolve(false);
            });
        });
    });
}
exports.installFileExistsAsync = installFileExistsAsync;
function touchInstallFileAsync() {
    return new Promise((resolve, reject) => {
        // Write the VS Code version to the file that indicates dependencies were installed.
        fs.writeFile(getInstallFilePath(), vscode.version + '\n', err => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}
//# sourceMappingURL=downloader.js.map