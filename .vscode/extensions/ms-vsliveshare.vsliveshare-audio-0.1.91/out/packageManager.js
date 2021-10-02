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
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
const fs = require("fs-extra");
const os = require("os");
const path = require("path");
const tmp = require("tmp");
const extensionutil_1 = require("./extensionutil");
const util = require("./util");
const traceSource_1 = require("./tracing/traceSource");
const tar = require("tar");
const crypto = require("crypto");
const glob = require("glob");
const vscode = require("vscode");
const semver = require("semver");
const _ = require("lodash");
const extractZip = require("extract-zip");
let download = function (url, destination, options) {
    // The 'npm-conf' package, a transitive dependency of the 'download' package,
    // changes `process.env.HOME`, which can cause problems for other extensions
    // in the same host process. There's no way to avoid it while still using the
    // 'download' package. So as a workaround this wrapper restores the env variable
    // after importing the package.
    const homeEnv = process.env.HOME;
    // Overwite the download variable so any future invocations skip this wrapper.
    download = require('download');
    if (homeEnv)
        process.env.HOME = homeEnv;
    else
        delete process.env.HOME;
    return download(url, destination, options);
};
class PackageError extends Error {
    // Do not put PII (personally identifiable information) in the 'message' field as it will be logged to telemetry
    constructor(message, pkg = null, innerError = null) {
        super(message);
        this.message = message;
        this.pkg = pkg;
        this.innerError = innerError;
    }
}
exports.PackageError = PackageError;
class PackageManager {
    constructor(platform, architecture, packageJSON) {
        this.platform = platform;
        this.architecture = architecture;
        this.packageJSON = packageJSON;
        this.packageStats = {};
        this.tempPath = 'temp';
        if (this.packageJSON.runtimeDependencies) {
            this.allPackages = this.packageJSON.runtimeDependencies;
        }
        else {
            throw (new PackageError('Package manifest does not exist.'));
        }
        // Ensure our temp files get cleaned up in case of error.
        tmp.setGracefulCleanup();
    }
    get stats() {
        return this.packageStats;
    }
    static getPackageCode(packageJSON, name) {
        if (packageJSON.runtimeDependencies) {
            const allPackages = packageJSON.runtimeDependencies;
            const matchingPackage = allPackages.find(pkg => {
                return (pkg.code && pkg.code.indexOf(name) !== -1) &&
                    (pkg.platforms && pkg.platforms.indexOf(os.platform()) !== -1);
            });
            if (matchingPackage) {
                return matchingPackage.code;
            }
        }
        return null;
    }
    getSupportedPackages() {
        if (this.supportedPackages) {
            return this.supportedPackages;
        }
        let list = this.allPackages;
        let supportedPackges = list.filter(pkg => {
            if (pkg.architectures && pkg.architectures.indexOf(this.architecture) === -1) {
                return false;
            }
            if (pkg.platforms && pkg.platforms.indexOf(this.platform) === -1) {
                return false;
            }
            const thisVscodeVersion = vscode.version.split('-')[0];
            if (pkg.vscodeVersion && !semver.satisfies(thisVscodeVersion, pkg.vscodeVersion)) {
                return false;
            }
            return true;
        });
        let groupedPackages = _.groupBy(supportedPackges, (pkg) => {
            return pkg.code;
        });
        for (let packageCode of _.keys(groupedPackages)) {
            if (groupedPackages[packageCode].length > 1) {
                traceSource_1.defaultTraceSource.error(`Multiple of same type are supported. Unable to infer which version is supported. PackageCode: ${packageCode}; ${JSON.stringify(groupedPackages[packageCode])}`);
                throw new Error(`Multiple of same type are supported. Unable to infer which version is supported. PackageCode: ${packageCode}`);
            }
        }
        this.supportedPackages = supportedPackges;
        return this.supportedPackages;
    }
    downloadPackagesAsync(status) {
        return __awaiter(this, void 0, void 0, function* () {
            const packages = this.getSupportedPackages();
            for (const pkg of packages) {
                this.stats[pkg.code] = {};
                yield this.maybeDownloadPackageAsync(pkg, status);
            }
        });
    }
    installPackagesAsync(status) {
        return __awaiter(this, void 0, void 0, function* () {
            const packages = this.getSupportedPackages();
            for (const pkg of packages) {
                yield this.installPackageAsync(pkg, status);
            }
        });
    }
    static getBaseInstallPath(pkg) {
        let basePath = extensionutil_1.ExtensionUtil.getGlobalStoragePath();
        if (pkg.installPath) {
            basePath = path.join(basePath, pkg.installPath);
        }
        return basePath;
    }
    static getBaseUnpackPath(basePath, pkg) {
        if (pkg.unpackPath) {
            basePath = path.join(basePath, pkg.unpackPath);
        }
        return basePath;
    }
    static ensureCleanPath(installPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (installPath && (yield fs.pathExists(installPath))) {
                // The call to fs.remove will fail on an attempt to delete
                // .asar files. Temporarily set noAsar to true on the process to
                // ensure they are properly removed.
                const tempProcess = process;
                const noAsar = tempProcess.noAsar;
                tempProcess.noAsar = true;
                yield fs.remove(installPath);
                tempProcess.noAsar = noAsar;
                traceSource_1.defaultTraceSource.info(`Cleaned old files from install path`);
            }
        });
    }
    getBaseRetryDeletePath(basePath, baseUnpackPath, pkg) {
        if (pkg.retryDeletePath) {
            return path.join(basePath, pkg.retryDeletePath);
        }
        if (basePath !== baseUnpackPath) {
            return baseUnpackPath;
        }
    }
    maybeDownloadPackageAsync(pkg, status) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: add config setting to force download
            let shouldDownload = !(yield this.doesPackageTestPathExistAsync(pkg));
            if (shouldDownload) {
                yield this.downloadPackageAsync(pkg, status);
            }
            else {
                traceSource_1.defaultTraceSource.info(`Skipping package '${pkg.description}' (already downloaded).`);
            }
            this.stats[pkg.code].didDownload = shouldDownload;
        });
    }
    downloadPackageAsync(pkg, status) {
        return __awaiter(this, void 0, void 0, function* () {
            traceSource_1.defaultTraceSource.info(`Downloading package '${pkg.description}' `);
            status.setMessage('Finishing VSLS Audio installation (downloading)...');
            pkg.tmpFile = yield this.createTempFile(pkg);
            yield this.downloadFileAsync(pkg.url, pkg);
            traceSource_1.defaultTraceSource.info('Download complete.');
        });
    }
    downloadFileAsync(urlString, pkg) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!pkg.tmpFile || pkg.tmpFile.fd === 0) {
                throw new PackageError('Temporary package file unavailable', pkg);
            }
            try {
                let data = yield download(urlString, null, { followRedirect: true });
                let hash = crypto.createHash('sha1').update(data).digest('hex');
                let hasMatch = hash === pkg.checksum;
                this.stats[pkg.code].checksumPass = hasMatch;
                if (!hasMatch) {
                    throw new PackageError(`Checksum does not match for ${pkg.description}. Expected '${pkg.checksum}' got '${hash}'`, pkg);
                }
                fs.writeFileSync(pkg.tmpFile.name, data);
            }
            catch (err) {
                throw new PackageError(`Reponse error: ${err.message || 'NONE'}`, pkg, err);
            }
        });
    }
    createTempFile(pkg) {
        return new Promise((resolve, reject) => {
            tmp.file({ prefix: 'package-' }, (err, tmpPath, fd, cleanupCallback) => {
                if (err) {
                    return reject(new PackageError('Error from tmp.file', pkg, err));
                }
                resolve({ name: tmpPath, fd: fd, removeCallback: cleanupCallback });
            });
        });
    }
    doesPackageTestPathExistAsync(pkg) {
        const testPath = this.getPackageTestPath(pkg);
        if (testPath) {
            return util.fileExistsAsync(testPath);
        }
        else {
            return Promise.resolve(false);
        }
    }
    getPackageTestPath(pkg) {
        if (pkg.installTestPath) {
            return path.join(extensionutil_1.ExtensionUtil.getGlobalStoragePath(), pkg.installTestPath);
        }
        else {
            return null;
        }
    }
    installPackageAsync(pkg, status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!pkg.tmpFile) {
                // Download of this package was skipped, so there is nothing to install
                return;
            }
            traceSource_1.defaultTraceSource.info(`Installing package '${pkg.description}'`);
            status.setMessage('Finishing VSLS Audio installation (installing)...');
            try {
                if (pkg.tmpFile.fd === 0) {
                    throw new PackageError('Downloaded file unavailable', pkg);
                }
                const baseInstallPath = PackageManager.getBaseInstallPath(pkg);
                yield PackageManager.ensureCleanPath(baseInstallPath);
                traceSource_1.defaultTraceSource.verbose(`Installing package '${pkg.description}' to: ${baseInstallPath}`);
                const baseUnpackPath = PackageManager.getBaseUnpackPath(baseInstallPath, pkg);
                const baseRetryDeletePath = this.getBaseRetryDeletePath(baseInstallPath, baseUnpackPath, pkg);
                yield PackageManager.ensureCleanPath(baseRetryDeletePath);
                const baseFilesPreUnpack = PackageManager.getAllFilesSync(baseUnpackPath);
                this.stats[pkg.code].totalBaseFilesPreUnpack = baseFilesPreUnpack.length;
                yield this.unpackDownloadedPackage(pkg, baseUnpackPath);
                yield util.moveElseThrowAsync(path.join(baseUnpackPath, pkg.packageRootPath), baseInstallPath);
                if (pkg.chmod && pkg.chmodPaths) {
                    pkg.chmodPaths.forEach((p) => {
                        const targetPath = path.join(baseInstallPath, p);
                        traceSource_1.defaultTraceSource.info(`Setting chmod: '${pkg.chmod}' for ${targetPath}`);
                        fs.chmodSync(targetPath, pkg.chmod);
                    });
                }
                traceSource_1.defaultTraceSource.info('Finished installing.');
            }
            catch (err) {
                // If anything goes wrong with unzip, make sure we delete the test path (if there is one)
                // so we will retry again later
                const testPath = this.getPackageTestPath(pkg);
                if (testPath) {
                    fs.unlink(testPath, err => { });
                }
                throw err;
            }
            finally {
                // Clean up temp file
                pkg.tmpFile.removeCallback();
            }
        });
    }
    unpackDownloadedPackage(pkg, baseUnpackPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileType = (path.extname(pkg.url) || path.extname(pkg.description) || '')
                .toLowerCase();
            if (fileType === '.zip') {
                yield this.unzipPackageAsync(pkg, baseUnpackPath);
            }
            else if (fileType === '.tgz' || fileType === '.gz') {
                yield this.untarPackageAsync(pkg, baseUnpackPath);
            }
            else {
                throw new Error(`Archive type '${fileType}' for '${pkg.description}' not supported`);
            }
            traceSource_1.defaultTraceSource.verbose('Extracted packed files');
        });
    }
    unzipPackageAsync(pkg, baseUnpackPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const noAsar = process.noAsar;
            process.noAsar = true;
            try {
                yield fs.ensureDir(baseUnpackPath);
                yield extractZip(pkg.tmpFile.name, { dir: baseUnpackPath });
            }
            catch (err) {
                throw new PackageError('Zip File Error:' + (err.message || ''), pkg, err);
            }
            finally {
                process.noAsar = noAsar;
            }
        });
    }
    untarPackageAsync(pkg, baseUnpackPath) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield fs.ensureDir(baseUnpackPath);
                yield tar.extract({ cwd: baseUnpackPath, file: pkg.tmpFile.name }, [pkg.packageRootPath]);
            }
            catch (err) {
                throw new PackageError('Zip File Error:' + err.code || '', pkg, err);
            }
        });
    }
    static moveUnpackedPackageFiles(pkg, getAllFiles, moveFn) {
        const baseInstallPath = PackageManager.getBaseInstallPath(pkg);
        const baseUnpackPath = PackageManager.getBaseUnpackPath(baseInstallPath, pkg);
        let files = getAllFiles(baseUnpackPath);
        files.forEach((f) => {
            let targetPath = path.join(baseInstallPath, path.basename(f));
            moveFn(f, targetPath);
        });
        traceSource_1.defaultTraceSource.info(`Moved package files.`);
    }
    static getAllFilesSync(cwd) {
        return glob.sync('**/*', { cwd, nodir: true, absolute: true, dot: true });
    }
    getAllRelativeFilesSync(cwd) {
        return glob.sync('**/*', { cwd, nodir: true, absolute: false, dot: true });
    }
}
exports.PackageManager = PackageManager;
//# sourceMappingURL=packageManager.js.map