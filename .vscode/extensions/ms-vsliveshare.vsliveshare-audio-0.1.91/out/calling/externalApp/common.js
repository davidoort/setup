"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const constants_1 = require("./constants");
class DeferredPromise {
    constructor() {
        let deferredResolve;
        let deferredReject;
        this.promise = new Promise((resolve, reject) => {
            deferredResolve = resolve;
            deferredReject = reject;
        });
        this.deferredReject = deferredReject;
        this.deferredResolve = deferredResolve;
    }
    resolve(data) {
        this.deferredResolve(data);
    }
    reject(error) {
        this.deferredReject(error);
    }
}
exports.DeferredPromise = DeferredPromise;
let userSettings;
function readLiveShareUserSettings(trace) {
    if (userSettings) {
        return userSettings;
    }
    const userSettingsFilePath = path.join(os.homedir(), constants_1.liveShareUserSettingsFileName);
    try {
        if (fs.existsSync(userSettingsFilePath)) {
            const settings = fs.readFileSync(userSettingsFilePath, 'utf8');
            userSettings = JSON.parse(settings);
            return userSettings;
        }
    }
    catch (e) {
        trace.info(`Error finding user settings at: ${userSettingsFilePath} ${e.message}`);
    }
}
exports.readLiveShareUserSettings = readLiveShareUserSettings;
function getStartOptions(base64Data) {
    const buffer = Buffer.from(base64Data, 'base64');
    const startOptionsJson = buffer.toString('utf8');
    return JSON.parse(startOptionsJson);
}
exports.getStartOptions = getStartOptions;
//# sourceMappingURL=common.js.map