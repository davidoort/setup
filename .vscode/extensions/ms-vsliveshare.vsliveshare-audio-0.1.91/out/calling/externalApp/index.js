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
const electronApp_1 = require("./electronApp");
const appEvents_1 = require("./appEvents");
const logFileTraceListener_1 = require("../../tracing/logFileTraceListener");
let { remote } = require('electron');
const trace = window.TraceSource;
const electronApp = new electronApp_1.ElectronApp(trace);
const dispose = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: dispose');
    return yield electronApp.dispose();
});
const endCall = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: endCall');
    return yield electronApp.endAndCleanUpCurrentCall();
});
const enumerateDevices = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: enumerateDevices');
    return yield electronApp.enumerateDevices();
});
const getCallInfo = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: callInfo');
    return electronApp.getCallInfo();
});
const getCurrentParticipants = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: currentParticipants');
    return yield electronApp.getCurrentParticipants();
});
const getDominantSpeakers = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: dominantSpeakers');
    return yield electronApp.getDominantSpeakers();
});
const getSelectedDevices = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: selectedDevices');
    return electronApp.getSelectedDevices();
});
const getWindowsForSharing = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: getWindowsForSharing');
    return yield electronApp.getWindowsForSharing();
});
const initalizeStack = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: initalizeStack');
    return yield electronApp.initialize(event.skypeToken, event.displayName);
});
const isMuted = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: isMuted');
    return electronApp.isMuted();
});
const loadSlimCore = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: loadSlimCore');
    return yield electronApp.loadSlimCore();
});
const muteOrUnmute = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: muteOrUnmute');
    return electronApp.muteOrUnmute(event.isMute, event.participant);
});
const selectDevices = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: selectDevices');
    return electronApp.selectDevices(event.selectedDevices);
});
const showWindow = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: showWindow');
    yield electronApp.showWindow();
});
const hideWindow = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: hideWindow');
    yield electronApp.hideWindow();
});
const shareWindow = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: shareWindow');
    yield electronApp.shareWindow(event.windowId);
});
const startAudio = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: startAudio');
    return yield electronApp.startAudio();
});
const startOrJoinCall = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: startOrJoinCall');
    return yield electronApp.connectToCall(event.groupContext, event.enableAudio);
});
const stopScreenSharing = (event) => __awaiter(this, void 0, void 0, function* () {
    trace.info('Request: stopScreenSharing');
    return yield electronApp.stopScreenSharing();
});
window.onload = () => __awaiter(this, void 0, void 0, function* () {
    const logFileTraceListener = new logFileTraceListener_1.LogFileTraceListener('VSLSAudio_ElectronRendererProcess');
    yield logFileTraceListener.openAsync();
    trace.addTraceListener(logFileTraceListener);
    const appEvents = window.appEvents;
    appEvents.on(appEvents_1.RequestType.dispose, dispose);
    appEvents.on(appEvents_1.RequestType.endCall, endCall);
    appEvents.on(appEvents_1.RequestType.enumerateDevices, enumerateDevices);
    appEvents.on(appEvents_1.RequestType.getCallInfo, getCallInfo);
    appEvents.on(appEvents_1.RequestType.getCurrentParticipants, getCurrentParticipants);
    appEvents.on(appEvents_1.RequestType.getDominantSpeakers, getDominantSpeakers);
    appEvents.on(appEvents_1.RequestType.getSelectedDevices, getSelectedDevices);
    appEvents.on(appEvents_1.RequestType.getWindowsForSharing, getWindowsForSharing);
    appEvents.on(appEvents_1.RequestType.initializeStackEvent, initalizeStack);
    appEvents.on(appEvents_1.RequestType.isMuted, isMuted);
    appEvents.on(appEvents_1.RequestType.loadSlimCore, loadSlimCore);
    appEvents.on(appEvents_1.RequestType.muteOrUnmute, muteOrUnmute);
    appEvents.on(appEvents_1.RequestType.selectDevices, selectDevices);
    appEvents.on(appEvents_1.RequestType.shareWindow, shareWindow);
    appEvents.on(appEvents_1.RequestType.showWindow, showWindow);
    appEvents.on(appEvents_1.RequestType.hideWindow, hideWindow);
    appEvents.on(appEvents_1.RequestType.startAudio, startAudio);
    appEvents.on(appEvents_1.RequestType.startOrJoinCall, startOrJoinCall);
    appEvents.on(appEvents_1.RequestType.stopScreenSharing, stopScreenSharing);
    electronApp.callChangedEventEmitter.on(appEvents_1.NotificationType.callChanged, (event) => {
        appEvents.sendNotification(event);
    });
    yield appEvents.sendNotification(new appEvents_1.ElectronAppReady());
    document.getElementById('close-button').addEventListener('click', function (e) {
        electronApp.terminateControl();
        const win = remote.getCurrentWindow();
        win.hide();
    });
});
window.onbeforeunload = () => {
    electronApp.dispose();
};
//# sourceMappingURL=index.js.map