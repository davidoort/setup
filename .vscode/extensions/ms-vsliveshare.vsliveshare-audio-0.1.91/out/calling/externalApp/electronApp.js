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
const electronStackProvider_1 = require("./electronStackProvider");
const _ = require("lodash");
const call_1 = require("./call");
const appEvents_1 = require("./appEvents");
const EventEmitter = require("events");
const constants_1 = require("./constants");
class ElectronApp {
    constructor(trace) {
        this.trace = trace;
        this.logPrefix = `[ElectronApp]`;
        this.currentCallParticipants = {};
        this.callChangedEventEmitter = new EventEmitter();
        this.isScreenShareEnabled = window.StartOptions.isScreenShareEnabled;
        this.isScreenShareControlEnabled = window.StartOptions.isScreenShareControlEnabled;
    }
    loadSlimCore() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.trace.info(`${this.logPrefix} loadSlimCore`);
                this.stackProvider = new electronStackProvider_1.ElectronStackProvider(this.trace);
                this.callingStack = yield this.stackProvider.build();
                this.config = this.stackProvider.config;
                this.trace.info(`${this.logPrefix} loaded slimcore`);
            }
            catch (e) {
                this.trace.error(`${this.logPrefix} failed to load slimcore: ${e}`);
                throw e;
            }
        });
    }
    initialize(skypeToken, displayName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info(`${this.logPrefix} create callRegistry`);
            this.callRegistry = this.callingStack.getCallRegistry();
            this.trace.info(`${this.logPrefix} init callRegistry`);
            yield this.callRegistry.init({
                displayName: displayName, id: skypeToken.skypeId, tokenProvider: () => {
                    this.trace.info(`${this.logPrefix} return token`);
                    return Promise.resolve(skypeToken.skypeToken);
                }
            });
            this.trace.info(`${this.logPrefix} get DeviceManager`);
            this.deviceManager = this.callingStack.getDeviceManager();
            this.trace.info(`${this.logPrefix} get ScreenSharingManager`);
            this.screenSharingManager = this.callingStack.getScreenSharingManager();
            this.trace.info(`${this.logPrefix} done`);
            return new Promise((resolve, reject) => {
                setTimeout(() => resolve(), 1500);
            });
        });
    }
    endAndCleanUpCurrentCall() {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info(`${this.logPrefix} endAndCleanUpCurrentCall started`);
            if (!this.currentCall) {
                return;
            }
            try {
                yield this.currentCall.stop();
            }
            finally {
                if (this.callWrapper) {
                    this.trace.info(`${this.logPrefix} disposing call wrapper`);
                    this.callWrapper.dispose();
                    this.callWrapper = null;
                }
                this.trace.info(`${this.logPrefix} disposing participants`);
                Object.keys(this.currentCallParticipants).forEach(id => {
                    this.trace.info(`${this.logPrefix} disposing call participant with id: ${id}`);
                    this.currentCallParticipants[id].dispose();
                });
                this.currentCallParticipants = {};
                this.currentCall = null;
                this.isScreenSharing = false;
                if (this.callChangedCallback) {
                    this.callChangedCallback.dispose();
                    this.callChangedCallback = null;
                }
            }
            this.trace.info(`${this.logPrefix} endAndCleanUpCurrentCall completed`);
        });
    }
    enumerateDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.deviceManager) {
                return [];
            }
            const devices = yield this.deviceManager.enumerateDevicesAsync();
            this.trace.info(`${this.logPrefix} finished enumerating devices: ${devices}`);
            return devices;
        });
    }
    getSelectedDevices() {
        if (!this.deviceManager) {
            return;
        }
        return this.deviceManager.getSelectedDevices();
    }
    getCurrentParticipants() {
        return this.currentCallParticipants ? _.map(this.currentCallParticipants, (x) => {
            return {
                displayName: x.displayName,
                id: x.id,
                isServerMuted: x.isServerMuted,
                voiceLevel: x.voiceLevel
            };
        }) : [];
    }
    getDominantSpeakers() {
        if (!this.currentCall) {
            return [];
        }
        return _.map(this.currentCall.dominantSpeakerInfo.speakerList, (x) => {
            const participant = this.currentCallParticipants[x];
            return {
                displayName: participant.displayName,
                id: participant.id,
                isServerMuted: participant.isServerMuted,
                voiceLevel: participant.voiceLevel
            };
        });
    }
    selectDevices(selectedDevices) {
        if (!this.deviceManager) {
            return;
        }
        return this.deviceManager.selectDevices(selectedDevices);
    }
    isMuted() {
        if (!this.callWrapper) {
            return true;
        }
        return this.callWrapper.isMuted();
    }
    getWindowsForSharing() {
        return __awaiter(this, void 0, void 0, function* () {
            const windows = yield this.screenSharingManager.enumerateWindowsAsync();
            return windows.map((w) => {
                return {
                    id: w.getId(),
                    description: w.getDescription(),
                    appName: w.getAppName()
                };
            });
        });
    }
    shareWindow(windowId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info(`${this.logPrefix} Share window start: ${windowId}`);
            if (!this.isScreenShareEnabled) {
                this.trace.info(`${this.logPrefix} cannot share window when screen sharing is disabled`);
                return;
            }
            const allWindows = yield this.screenSharingManager.enumerateWindowsAsync();
            const filteredWindows = _.filter(allWindows, (w) => w.getId() === windowId);
            if (!filteredWindows || !filteredWindows.length) {
                throw new Error('Window does not exist');
            }
            if (!this.isCallConnected) {
                this.trace.warning(`${this.logPrefix} cannot share when call isn't connected. State: ${this.currentCall && this.currentCall.state}`);
                return;
            }
            yield this.currentCall.startScreenSharing(filteredWindows[0]);
            this.isScreenSharing = true;
            this.trace.info(`${this.logPrefix} Share window end`);
        });
    }
    showWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isScreenShareEnabled) {
                this.trace.info(`${this.logPrefix} cannot show window when screen sharing is disabled`);
                return;
            }
            if (this.callWrapper) {
                this.callWrapper.showWindow();
            }
        });
    }
    hideWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.callWrapper) {
                this.callWrapper.hideWindow();
            }
        });
    }
    stopScreenSharing() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.currentCall.stopScreenSharing();
            this.isScreenSharing = false;
            const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.screenShareEnded);
            this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
        });
    }
    terminateControl() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isScreenShareControlEnabled) {
                const screenSharingControl = this.currentCall.screenSharingControl;
                yield screenSharingControl.terminateControl();
            }
        });
    }
    startAudio() {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.info(`${this.logPrefix} Start audio for screen sharing only call: ${this.currentCall.callId}`);
            yield this.currentCall.startAudio().then(status => {
                if (status === 0 /* Succeeded */) {
                    this.trace.info(`${this.logPrefix} Screen sharing call was escalated: ${this.currentCall.callId}`);
                }
                else {
                    this.trace.error(`${this.logPrefix} Failed to escalate screensharing call: ${this.currentCall.callId}, with status: ${status}`);
                }
            })
                .catch(error => {
                this.trace.error(`${this.logPrefix} Failed to escalate screensharing call: ${this.currentCall.callId}, with error: ${error}`);
            });
        });
    }
    connectToCall(groupContext, enableAudio) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentCall) {
                this.trace.warning(`${this.logPrefix} Already connected to a call`);
                return this.endAndCleanUpCurrentCall().then(() => {
                    return Promise.reject(new Error('Already connected to a call. Ending current call. Please retry audio join'));
                });
            }
            try {
                this.trace.info(`${this.logPrefix} Connecting to call with group context: ${groupContext} enableAudio:${enableAudio}`);
                const call = this.callRegistry.createCall(groupContext);
                call.init({ threadId: groupContext, mediaPeerType: 2 /* ConsumerMultiParty */ });
                call.on('callStateChanged', () => __awaiter(this, void 0, void 0, function* () {
                    this.trace.info(`${this.logPrefix} callStateChanged: ${call.state}`);
                    if (call.state === 7 /* Disconnected */) {
                        const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.callDisconnected);
                        this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                        // Ensure call is cleaned up
                        yield this.endAndCleanUpCurrentCall();
                    }
                }));
                call.on('participantAdded', () => __awaiter(this, void 0, void 0, function* () {
                    this.trace.info(`${this.logPrefix} participantAdded`);
                    _.forEach(call.participants, (participant) => __awaiter(this, void 0, void 0, function* () {
                        if (!(participant.id in this.currentCallParticipants)) {
                            this.currentCallParticipants[participant.id] = participant;
                            const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.participantsChanged);
                            this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                        }
                    }));
                }));
                call.on('participantRemoved', () => {
                    this.trace.info(`${this.logPrefix} participantRemoved`);
                    const stillInCall = {};
                    _.forEach(call.participants, (participant) => {
                        stillInCall[participant.id] = participant;
                    });
                    let toRemove = [];
                    _.forEach(Object.keys(this.currentCallParticipants), (participantId) => {
                        if (!(participantId in stillInCall)) {
                            toRemove.push(this.currentCallParticipants[participantId]);
                        }
                    });
                    _.forEach(toRemove, (participant) => {
                        delete this.currentCallParticipants[participant.id];
                        const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.participantsChanged);
                        this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                    });
                    toRemove = null;
                });
                call.on('serverMutedChanged', (isServerMuted) => {
                    this.trace.info(`${this.logPrefix} serverMutedChanged: ${isServerMuted}`);
                    const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.muteChanged, /*callParticipant*/ null);
                    this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                });
                call.on('participantUpdated', (participant) => {
                    this.trace.info(`${this.logPrefix} participantUpdated`);
                    const participantInfo = {
                        displayName: participant.displayName,
                        id: participant.id,
                        isServerMuted: participant.isServerMuted,
                        voiceLevel: participant.voiceLevel
                    };
                    const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.participantChanged, participantInfo);
                    this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                });
                call.on('callStateChanged', () => {
                    this.trace.info(`${this.logPrefix} callStateChanged: ${call.state}`);
                    switch (call.state) {
                        case 3 /* Connected */:
                            {
                                this.trace.info(`${this.logPrefix} callStateChanged: connected to call`);
                                const callInfo = {
                                    threadId: call.threadId,
                                    callId: call.callId,
                                    state: call.state
                                };
                                const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.callStarted, null, callInfo);
                                this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                            }
                            break;
                        default:
                            return;
                    }
                });
                this.currentCall = call;
                const isHost = window.StartOptions.isHost;
                this.trace.info(`isHost: ${isHost}`);
                this.trace.info(`isScreenShareEnabled: ${this.isScreenShareEnabled}`);
                this.trace.info(`isScreenShareControlEnabled: ${this.isScreenShareControlEnabled}`);
                const audioDirection = enableAudio ? 4 /* Bidirectional */ : 3 /* Inactive */;
                const screenshareDirection = this.isScreenShareEnabled ? 4 /* Bidirectional */ : 0 /* Disabled */;
                const dataChannelDirection = this.isScreenShareControlEnabled ? 4 /* Bidirectional */ : 0 /* Disabled */;
                const callStartOptions = {
                    audioDirection: audioDirection,
                    ringOthers: false,
                    screenshareDirection: screenshareDirection,
                    videoDirection: 0 /* Disabled */,
                    datachannelDirection: dataChannelDirection
                };
                this.callChangedCallback = call.changed(() => {
                    if (this.isScreenSharing && !call.isScreenSharingOn) {
                        this.trace.info(`${this.logPrefix} screen sharing ended`);
                        this.isScreenSharing = false;
                        const event = new appEvents_1.CallChanged(appEvents_1.CallChangedType.screenShareEnded);
                        this.callChangedEventEmitter.emit(appEvents_1.NotificationType.callChanged, event);
                    }
                });
                yield call.start(callStartOptions);
                this.callWrapper = new call_1.default(call, isHost, this.isScreenShareControlEnabled, this.trace);
                if (this.isScreenShareControlEnabled) {
                    this.enableScreenSharingControl(call, isHost);
                }
            }
            catch (e) {
                this.trace.error(`${this.logPrefix} error while connecting to call: ${e.message}`);
                throw e;
            }
        });
    }
    muteOrUnmute(isMute, participantInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.currentCall) {
                return;
            }
            let mutedParticipants;
            if (!participantInfo) {
                // Mute or unmute my own microphone.
                return isMute ? yield this.currentCall.mute() : yield this.currentCall.unmute();
            }
            // Find the participant associated with the participant info
            const participant = _.find(this.currentCallParticipants, (x) => (x.id === participantInfo.id));
            if (!participant) {
                return;
            }
            // Mute or unmute a participant.
            mutedParticipants = _.filter(this.currentCallParticipants, p => p.isServerMuted);
            const index = mutedParticipants.indexOf(participant);
            if (isMute && index < 0) {
                // Add the participant to the list of muted participants.
                mutedParticipants.push(participant);
            }
            else if (!isMute && index >= 0) {
                // Remove the participant from the list of muted participants.
                mutedParticipants.splice(index, 1);
            }
            yield this.currentCall.muteParticipants(1 /* Specified */, mutedParticipants);
        });
    }
    getCallInfo() {
        if (!this.callWrapper) {
            return;
        }
        return this.callWrapper.getCallInfo();
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.endAndCleanUpCurrentCall();
            if (this.stackProvider) {
                this.stackProvider.dispose();
                this.stackProvider = null;
            }
            this.callingStack = null;
            this.callRegistry = null;
            this.deviceManager = null;
            this.screenSharingManager = null;
            this.config = null;
        });
    }
    isCallConnected() {
        return this.currentCall && this.currentCall.state === 3 /* Connected */;
    }
    enableScreenSharingControl(call, isHost) {
        const screenSharingControl = this.currentCall.screenSharingControl;
        screenSharingControl.setScreenSharingControlFeatureFlag(/*enabled*/ true);
        if (isHost) {
            this.trace.info(`Host: setup screen sharing for ${call.participantId}`);
            screenSharingControl.enableScreenSharingControl(/*enabled*/ true, /*reason*/ null, /*detail*/ null, /*allowControlForUser*/ (userId) => {
                this.trace.info(`${this.logPrefix} Screen share control for user: ${userId}`);
                return Promise.resolve(true);
            });
            screenSharingControl.on('sharingIncomingControlRequest', (id) => {
                const participant = this.currentCall.participants.find(p => p.id === id);
                this.trace.info(`${this.logPrefix} Set pointer images for participant: ${participant}`);
                screenSharingControl.setRemotePointerImage(participant, constants_1.avatarBase64);
                screenSharingControl.setLocalPointerImage(constants_1.ghostAvatarBase64);
                this.trace.info(`${this.logPrefix} Processing accept control request for sharer`);
                this.currentCall.screenSharingControl.acceptControlRequest().then(() => this.trace.info(`${this.logPrefix} acceptControlRequest completed successfully`)).catch((err) => this.trace.error(`acceptControlRequest error: ${err}`));
            });
        }
        else {
            this.trace.info(`${this.logPrefix} Guest: setup screen sharing for ${call.participantId}`);
            screenSharingControl.on('sharingControlCapable', (capability) => {
                this.trace.info(`${this.logPrefix} sharingControlCapable raised. [Capabilty] capable:${capability.capable}, disabledBySharer:${capability.disabledBySharer}, id:${capability.id}`);
                if (capability.capable && !capability.disabledBySharer) {
                    screenSharingControl.requestControl().then(() => this.trace.info(`${this.logPrefix} Control taken`)).catch((err) => this.trace.info(`${this.logPrefix} Control taken error: ${err}`));
                }
            });
        }
    }
}
exports.ElectronApp = ElectronApp;
//# sourceMappingURL=electronApp.js.map