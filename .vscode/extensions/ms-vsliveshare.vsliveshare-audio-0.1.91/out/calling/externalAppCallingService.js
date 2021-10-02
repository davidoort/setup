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
const _ = require("lodash");
const path = require("path");
const fs = require("fs-extra");
const traceSource_1 = require("../tracing/traceSource");
const callingUtils_1 = require("./callingUtils");
const vscode_1 = require("vsls/vscode");
const MessagingService_1 = require("../messaging/MessagingService");
const callingEvents_1 = require("./callingEvents");
const callsTracker_1 = require("./callsTracker");
const child_process_1 = require("child_process");
const appEvents_1 = require("./externalApp/appEvents");
const jsonRpc_1 = require("./externalApp/jsonRpc");
const common_1 = require("./externalApp/common");
const extensionutil_1 = require("../extensionutil");
const util_1 = require("../util");
const constants_1 = require("../constants");
const extension_1 = require("../extension");
class ExternalAppCallingService {
    constructor(liveShare, delayInitialization) {
        this.newCallEventEmitter = new vscode.EventEmitter();
        this.onNewAudioCallAvailable = this.newCallEventEmitter.event;
        this.muteChangedEventEmitter = new vscode.EventEmitter();
        this.onMuteChanged = this.muteChangedEventEmitter.event;
        this.participantsChangedEventEmitter = new vscode.EventEmitter();
        this.onParticipantsChanged = this.participantsChangedEventEmitter.event;
        this.participantChangedEventEmitter = new vscode.EventEmitter();
        this.onParticipantChanged = this.participantChangedEventEmitter.event;
        this.endCallEventEmitter = new vscode.EventEmitter();
        this.onCallEnded = this.endCallEventEmitter.event;
        this.trace = traceSource_1.defaultTraceSource.withName('ExternalAppCallingService');
        this.liveShare = liveShare;
        this.messagingService = new MessagingService_1.MessagingService(liveShare);
        this.messagingService.event(this.onMessagingServiceEvent.bind(this));
        this.callsTracker = new callsTracker_1.CallsTracker(this.messagingService);
        this.callsTracker.onNewAudioCallAvailable(() => this.newCallEventEmitter.fire());
        if (!delayInitialization) {
            this.initialize();
        }
        else {
            this.trace.info('Calling stack will be lazy loaded');
        }
    }
    onMessagingServiceEvent(eventMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const callingEvent = eventMessage;
            if (callingEvent && (callingEvent.callingEventType === callingEvents_1.CallingEventType.CallInformationRequest)) {
                const callInfo = yield this.getCallInfo();
                if (callInfo && (callInfo.state === 3 /* Connected */)) {
                    this.messagingService.fire({
                        callingEventType: callingEvents_1.CallingEventType.CallStarted,
                        groupContext: callInfo.threadId,
                        callId: callInfo.callId
                    });
                }
            }
        });
    }
    getVSLSToken() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.currentToken && new Date().getTime() < this.currentToken.expiresIn - (3600 * 1000)) {
                return this.currentToken;
            }
            this.currentToken = yield callingUtils_1.getVSLSTokenFromAuthService(this.trace);
            return this.currentToken;
        });
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isInitialized) {
                return;
            }
            this.isDisposed = false;
            const ipcPipeName = `vslsaudio-${this.randomInt()}`;
            const ipcChannel = new jsonRpc_1.JsonRPC(ipcPipeName, this.trace, /*serverMode*/ true);
            this.appEvents = new appEvents_1.AppEvents(ipcChannel);
            this.appEvents.on(appEvents_1.NotificationType.trace, (event) => __awaiter(this, void 0, void 0, function* () {
                switch (event.traceType) {
                    case appEvents_1.TraceType.error:
                        this.trace.error(event.message);
                        break;
                    case appEvents_1.TraceType.info:
                        this.trace.info(event.message);
                        break;
                    case appEvents_1.TraceType.warning:
                        this.trace.warning(event.message);
                        break;
                    default:
                        throw new Error(`Unexpected trace type: ${event.traceType}`);
                }
            }));
            this.appEvents.on(appEvents_1.NotificationType.callChanged, (event) => __awaiter(this, void 0, void 0, function* () {
                this.trace.info(`Call changed event received from external app: ${event.changeType}`);
                switch (event.changeType) {
                    case appEvents_1.CallChangedType.callStarted:
                        this.messagingService.fire({
                            callingEventType: callingEvents_1.CallingEventType.CallStarted,
                            groupContext: event.callInfo.threadId,
                            callId: event.callInfo.callId
                        });
                        break;
                    case appEvents_1.CallChangedType.callDisconnected:
                        this.endCallEventEmitter.fire();
                        break;
                    case appEvents_1.CallChangedType.muteChanged:
                        this.muteChangedEventEmitter.fire(event.callParticipant);
                        break;
                    case appEvents_1.CallChangedType.participantChanged:
                        this.participantChangedEventEmitter.fire(event.callParticipant);
                        break;
                    case appEvents_1.CallChangedType.participantsChanged:
                        this.participantsChangedEventEmitter.fire();
                        break;
                    default:
                        throw new Error(`Unexpected call change type: ${event.changeType}`);
                }
            }));
            try {
                // Verify electron & slimcore runtime dependencies
                const electronPath = extensionutil_1.ExtensionUtil.getElectronPath();
                if (!fs.existsSync(electronPath)) {
                    this.trace.error(`Electron not found: ${electronPath}`);
                    yield vscode.commands.executeCommand(constants_1.INSTALLATION_RECOVERY_COMMAND, extension_1.InstallRecoverySource.Initialize);
                    // The user was given the opportunity to repair
                    // the installation but they canceled out of it.
                    throw new util_1.CancellationError('Live Share Audio repair canceled');
                }
                const slimCorePath = extensionutil_1.ExtensionUtil.getSlimCorePath();
                const slimCoreNode = path.join(`${slimCorePath}/bin/slimcore.node`);
                if (!fs.existsSync(slimCoreNode)) {
                    this.trace.error(`SlimCore not found: ${slimCoreNode}`);
                    yield vscode.commands.executeCommand(constants_1.INSTALLATION_RECOVERY_COMMAND, extension_1.InstallRecoverySource.Initialize);
                    // The user was given the opportunity to repair
                    // the installation but they canceled out of it.
                    throw new util_1.CancellationError('Live Share Audio repair canceled');
                }
                // Spawn the electron process for call hosting
                const extensionPath = vscode.extensions.getExtension('ms-vsliveshare.vsliveshare-audio').extensionPath;
                const isHost = (this.liveShare.session.role === vscode_1.Role.Host);
                // Enable screen share control for dev team members
                const settings = common_1.readLiveShareUserSettings(traceSource_1.defaultTraceSource);
                const isTeamMember = !!(settings && settings.teamStatus);
                const isScreenShareEnabled = isTeamMember;
                const isScreenShareControlEnabled = isTeamMember;
                const isDevToolsEnabled = (!!(settings && settings.experimentalFeatures && settings.experimentalFeatures.isDevToolsEnabled));
                const startOptions = {
                    slimCorePath,
                    ipcPipeName,
                    isHost,
                    isScreenShareEnabled,
                    isScreenShareControlEnabled,
                    isDevToolsEnabled
                };
                const startOptionsJson = JSON.stringify(startOptions);
                const buffer = Buffer.from(startOptionsJson, 'utf8');
                const encodedStartOptions = buffer.toString('base64');
                const parameters = [
                    path.join(extensionPath, './out/calling/externalApp/dist'),
                    encodedStartOptions
                ];
                const env = _.clone(process.env);
                delete env.ATOM_SHELL_INTERNAL_RUN_AS_NODE;
                delete env.ELECTRON_RUN_AS_NODE;
                // For MacOs spawn the child process with the open command.
                // If it is started without the use of launch services its permissions
                // will be attributed to VS Code's Electron process which doesn't
                // have the correct entitlements set for microphone & camera.
                const isMacOS = extensionutil_1.ExtensionUtil.getPlatformName() === 'MacOS';
                this.childProcess = isMacOS ?
                    child_process_1.spawn('open', ['-a', electronPath, '--wait-apps', '--new', '--args', ...parameters], { env: env }) :
                    child_process_1.spawn(electronPath, parameters, { env: env });
                this.killElectron = () => {
                    // From VS Code's debugAdapter comments:
                    // when killing a process in windows its child
                    // processes are *not* killed but become root
                    // processes. Therefore we use TASKKILL.EXE
                    if (process.platform === 'win32') {
                        child_process_1.exec(`taskkill /F /T /PID ${this.childProcess.pid}`, (err, stdout, stderr) => {
                            if (err) {
                                this.trace.error(`Error disposing electron: ${err}`);
                            }
                        });
                    }
                    else {
                        this.childProcess.kill('SIGKILL');
                    }
                };
                this.childProcess.on('error', this.onElectronError.bind(this));
                this.childProcess.on('close', this.onElectronClose.bind(this));
                // Wait for electron process to be ready
                this.ensureElectronReady = new common_1.DeferredPromise();
                this.appEvents.on(appEvents_1.NotificationType.electronAppReady, () => __awaiter(this, void 0, void 0, function* () {
                    this.trace.info(`ElectronAppReady event received`);
                    this.ensureElectronReady.resolve();
                }));
                yield this.ensureElectronReady.promise;
                let displayName = null;
                if (this.liveShare.session && this.liveShare.session.user) {
                    displayName = this.liveShare.session.user.displayName || this.liveShare.session.user.userName || this.liveShare.session.user.emailAddress;
                }
                displayName = displayName || 'Unknown user';
                this.trace.info('Getting SkypeToken');
                const skypeToken = yield this.getVSLSToken();
                this.trace.info('Initializing SlimCore');
                yield this.appEvents.sendRequest(new appEvents_1.LoadSlimCore());
                const event = new appEvents_1.InitializeStackEvent(skypeToken, displayName);
                yield this.appEvents.sendRequest(event);
                if (this.appEvents.isDisposed) {
                    throw new Error('Call initialization failed');
                }
            }
            catch (e) {
                this.trace.error(`Failed to initialize electron app: ${e.message} ${e.stack}`);
                throw e;
            }
            this.isInitialized = true;
        });
    }
    randomInt() {
        return Math.floor(Math.random() * Math.floor(Number.MAX_SAFE_INTEGER));
    }
    onElectronClose(code, signal) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isDisposed) {
                // Electron ended unexpectedly
                // Clean up and log an error
                yield this.dispose();
                this.endCallEventEmitter.fire();
                this.trace.error(`Electron closed unexpectedly: code:${code} signal:${signal}`);
            }
        });
    }
    onElectronError(e) {
        return __awaiter(this, void 0, void 0, function* () {
            this.trace.error(`Electron error encountered: ${e.message}`);
        });
    }
    checkIfCallIsAvailable() {
        this.trace.info('checkIfCallIsAvailable');
        this.messagingService.fire({
            callingEventType: callingEvents_1.CallingEventType.CallInformationRequest
        });
    }
    handleLiveShareSessionEnded() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.endAndCleanUpCurrentCall();
                yield this.dispose();
            }
            catch (e) {
                this.trace.error(`Failed to clean up call: ${e.message} ${e.stack}`);
            }
        });
    }
    connectToCall(groupContext, enableAudio = true) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.ensureCallStarted = new common_1.DeferredPromise();
                yield this.initialize();
                const mriGroupContext = `99:${groupContext}`;
                const event = new appEvents_1.StartOrJoinCall(mriGroupContext, enableAudio);
                yield this.appEvents.sendRequest(event);
                this.ensureCallStarted.resolve();
                yield this.setUserPreferences();
            }
            catch (e) {
                if (!this.isDisposed) {
                    // If the call hasn't been explicitly disposed
                    // (ex: call canceled or Live Share session ended)
                    // then log and throw the error
                    this.trace.error(`Failed to connect call: ${e.message} ${e.stack}`);
                    throw e;
                }
                // Otherwise, throw a cancellation error
                throw new util_1.CancellationError(e.message);
            }
        });
    }
    setUserPreferences() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = extensionutil_1.ExtensionUtil.Context.globalState;
            const microphoneId = settings.get(constants_1.SettingKeys.microphoneId);
            if (microphoneId) {
                yield this.selectDevice(microphoneId, 2 /* Microphone */);
            }
            const speakerId = settings.get(constants_1.SettingKeys.speakerId);
            if (speakerId) {
                yield this.selectDevice(speakerId, 3 /* Speaker */);
            }
        });
    }
    notifyOfParticipantAdded(participantName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showInformationMessage(`${participantName} joined the audio call`);
        });
    }
    notifyOfParticipantRemoved(participantName) {
        return __awaiter(this, void 0, void 0, function* () {
            yield vscode.window.showInformationMessage(`${participantName} left the audio call`);
        });
    }
    mute(participant) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.MuteOrUnmute(/*isMute*/ true, participant);
            yield this.appEvents.sendRequest(event);
            if (!participant) {
                this.muteChangedEventEmitter.fire();
            }
        });
    }
    unmute(participant) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.MuteOrUnmute(/*isMute*/ false, participant);
            yield this.appEvents.sendRequest(event);
            if (!participant) {
                this.muteChangedEventEmitter.fire();
            }
        });
    }
    isMuted() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return false;
            }
            return yield this.appEvents.sendRequest(new appEvents_1.IsMuted());
        });
    }
    getCallInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            return yield this.appEvents.sendRequest(new appEvents_1.GetCallInfo());
        });
    }
    enumerateDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return [];
            }
            return yield this.appEvents.sendRequest(new appEvents_1.EnumerateDevices());
        });
    }
    getCurrentDevices() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return {};
            }
            return this.appEvents.sendRequest(new appEvents_1.GetSelectedDevices());
        });
    }
    selectDevice(deviceId, deviceType) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const selectedDevices = yield this.getCurrentDevices();
            let settingsKey;
            switch (deviceType) {
                case 2 /* Microphone */:
                    settingsKey = constants_1.SettingKeys.microphoneId;
                    selectedDevices.microphone = deviceId;
                    break;
                case 3 /* Speaker */:
                    settingsKey = constants_1.SettingKeys.speakerId;
                    selectedDevices.speaker = deviceId;
                    break;
                default:
                    throw new Error(`Unexpected device type selected: ${deviceType}`);
            }
            const event = new appEvents_1.SelectDevices(selectedDevices);
            yield this.appEvents.sendRequest(event);
            const settings = extensionutil_1.ExtensionUtil.Context.globalState;
            yield settings.update(settingsKey, deviceId);
        });
    }
    endAndCleanUpCurrentCall() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.EndCall();
            yield this.appEvents.sendRequest(event);
            this.endCallEventEmitter.fire();
        });
    }
    getCurrentParticipants() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return [];
            }
            const event = new appEvents_1.GetCurrentParticipants();
            return yield this.appEvents.sendRequest(event);
        });
    }
    getDominantSpeakers() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return [];
            }
            const event = new appEvents_1.GetDominantSpeakers();
            return yield this.appEvents.sendRequest(event);
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isDisposed) {
                this.isDisposed = true;
                if (this.childProcess) {
                    this.childProcess.removeListener('error', this.onElectronError);
                    this.childProcess.removeListener('close', this.onElectronClose);
                }
                if (this.appEvents) {
                    const event = new appEvents_1.EndCall();
                    yield this.appEvents.sendRequest(event);
                    this.appEvents.dispose();
                }
                if (this.killElectron) {
                    this.killElectron();
                    this.killElectron = null;
                }
                if (this.ensureElectronReady) {
                    this.ensureElectronReady.resolve();
                    this.ensureElectronReady = null;
                }
                if (this.ensureCallStarted) {
                    this.ensureCallStarted.resolve();
                    this.ensureCallStarted = null;
                }
                this.currentToken = null;
                this.isInitialized = false;
            }
        });
    }
    isCallStarted() {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if the user has initiated a call
            if (!!!this.ensureCallStarted) {
                return false;
            }
            // ensure call is started
            yield this.ensureCallStarted.promise;
            return true;
        });
    }
    getWindowsForSharing() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return [];
            }
            return yield this.appEvents.sendRequest(new appEvents_1.GetWindowsForSharing());
        });
    }
    shareWindow(windowId) {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.ShareWindow(windowId);
            yield this.appEvents.sendRequest(event);
        });
    }
    showWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.ShowWindow();
            yield this.appEvents.sendRequest(event);
        });
    }
    hideWindow() {
        return __awaiter(this, void 0, void 0, function* () {
            const isCallStarted = yield this.isCallStarted();
            if (!isCallStarted) {
                return;
            }
            const event = new appEvents_1.HideWindow();
            yield this.appEvents.sendRequest(event);
        });
    }
}
exports.ExternalAppCallingService = ExternalAppCallingService;
//# sourceMappingURL=externalAppCallingService.js.map