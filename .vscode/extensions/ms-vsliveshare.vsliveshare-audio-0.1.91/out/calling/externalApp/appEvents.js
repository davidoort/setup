"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CallChangedType;
(function (CallChangedType) {
    CallChangedType[CallChangedType["callStarted"] = 0] = "callStarted";
    CallChangedType[CallChangedType["callDisconnected"] = 1] = "callDisconnected";
    CallChangedType[CallChangedType["muteChanged"] = 2] = "muteChanged";
    CallChangedType[CallChangedType["participantChanged"] = 3] = "participantChanged";
    CallChangedType[CallChangedType["participantsChanged"] = 4] = "participantsChanged";
    CallChangedType[CallChangedType["screenShareEnded"] = 5] = "screenShareEnded";
})(CallChangedType = exports.CallChangedType || (exports.CallChangedType = {}));
var RequestType;
(function (RequestType) {
    RequestType["dispose"] = "dispose";
    RequestType["endCall"] = "endCall";
    RequestType["enumerateDevices"] = "enumerateDevices";
    RequestType["getCallInfo"] = "getCallInfo";
    RequestType["getCurrentParticipants"] = "getCurrentParticipants";
    RequestType["getDominantSpeakers"] = "getDominantSpeakers";
    RequestType["getSelectedDevices"] = "getSelectedDevices";
    RequestType["getWindowsForSharing"] = "getWindowsForSharing";
    RequestType["initializeStackEvent"] = "initializeStackEvent";
    RequestType["isMuted"] = "isMuted";
    RequestType["loadSlimCore"] = "loadSlimCore";
    RequestType["muteOrUnmute"] = "muteOrUnmute";
    RequestType["selectDevices"] = "selectDevices";
    RequestType["shareWindow"] = "shareWindow";
    RequestType["showWindow"] = "showWindow";
    RequestType["hideWindow"] = "hideWindow";
    RequestType["startAudio"] = "startAudio";
    RequestType["startOrJoinCall"] = "startOrJoinCall";
    RequestType["stopScreenSharing"] = "stopScreenSharing";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["callChanged"] = "callChanged";
    NotificationType["electronAppReady"] = "electronAppReady";
    NotificationType["trace"] = "trace";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
var TraceType;
(function (TraceType) {
    TraceType[TraceType["error"] = 0] = "error";
    TraceType[TraceType["info"] = 1] = "info";
    TraceType[TraceType["warning"] = 2] = "warning";
})(TraceType = exports.TraceType || (exports.TraceType = {}));
class AppEvents {
    constructor(jsonRPCProxy) {
        this.jsonRPCProxy = jsonRPCProxy;
    }
    get isDisposed() {
        return this.jsonRPCProxy.isDisposed;
    }
    on(eventType, func) {
        this.jsonRPCProxy.on(eventType, func);
    }
    sendRequest(event) {
        return this.jsonRPCProxy.sendRequest(event);
    }
    sendNotification(event) {
        return this.jsonRPCProxy.sendNotification(event);
    }
    dispose() {
        this.jsonRPCProxy.dispose();
    }
}
exports.AppEvents = AppEvents;
class CallChanged {
    constructor(changeType, callParticipant, callInfo) {
        this.changeType = changeType;
        this.callParticipant = callParticipant;
        this.callInfo = callInfo;
        this.eventType = NotificationType.callChanged;
    }
}
exports.CallChanged = CallChanged;
class Dispose {
    constructor() {
        this.eventType = RequestType.dispose;
    }
}
exports.Dispose = Dispose;
class ElectronAppReady {
    constructor() {
        this.eventType = NotificationType.electronAppReady;
    }
}
exports.ElectronAppReady = ElectronAppReady;
class EndCall {
    constructor() {
        this.eventType = RequestType.endCall;
    }
}
exports.EndCall = EndCall;
class EnumerateDevices {
    constructor() {
        this.eventType = RequestType.enumerateDevices;
    }
}
exports.EnumerateDevices = EnumerateDevices;
class GetCallInfo {
    constructor() {
        this.eventType = RequestType.getCallInfo;
    }
}
exports.GetCallInfo = GetCallInfo;
class GetCurrentParticipants {
    constructor() {
        this.eventType = RequestType.getCurrentParticipants;
    }
}
exports.GetCurrentParticipants = GetCurrentParticipants;
class GetDominantSpeakers {
    constructor() {
        this.eventType = RequestType.getDominantSpeakers;
    }
}
exports.GetDominantSpeakers = GetDominantSpeakers;
class GetSelectedDevices {
    constructor() {
        this.eventType = RequestType.getSelectedDevices;
    }
}
exports.GetSelectedDevices = GetSelectedDevices;
class GetWindowsForSharing {
    constructor() {
        this.eventType = RequestType.getWindowsForSharing;
    }
}
exports.GetWindowsForSharing = GetWindowsForSharing;
class InitializeStackEvent {
    constructor(skypeToken, displayName) {
        this.skypeToken = skypeToken;
        this.displayName = displayName;
        this.eventType = RequestType.initializeStackEvent;
    }
}
exports.InitializeStackEvent = InitializeStackEvent;
class IsMuted {
    constructor() {
        this.eventType = RequestType.isMuted;
    }
}
exports.IsMuted = IsMuted;
class LoadSlimCore {
    constructor() {
        this.eventType = RequestType.loadSlimCore;
    }
}
exports.LoadSlimCore = LoadSlimCore;
class MuteOrUnmute {
    constructor(isMute, participant) {
        this.isMute = isMute;
        this.participant = participant;
        this.eventType = RequestType.muteOrUnmute;
    }
}
exports.MuteOrUnmute = MuteOrUnmute;
class SelectDevices {
    constructor(selectedDevices) {
        this.selectedDevices = selectedDevices;
        this.eventType = RequestType.selectDevices;
    }
}
exports.SelectDevices = SelectDevices;
class ShareWindow {
    constructor(windowId) {
        this.windowId = windowId;
        this.eventType = RequestType.shareWindow;
    }
}
exports.ShareWindow = ShareWindow;
class ShowWindow {
    constructor() {
        this.eventType = RequestType.showWindow;
    }
}
exports.ShowWindow = ShowWindow;
class HideWindow {
    constructor() {
        this.eventType = RequestType.hideWindow;
    }
}
exports.HideWindow = HideWindow;
class StartAudio {
    constructor() {
        this.eventType = RequestType.startAudio;
    }
}
exports.StartAudio = StartAudio;
class StartOrJoinCall {
    constructor(groupContext, enableAudio) {
        this.groupContext = groupContext;
        this.enableAudio = enableAudio;
        this.eventType = RequestType.startOrJoinCall;
    }
}
exports.StartOrJoinCall = StartOrJoinCall;
class StopScreenSharing {
    constructor() {
        this.eventType = RequestType.stopScreenSharing;
    }
}
exports.StopScreenSharing = StopScreenSharing;
class Trace {
    constructor(traceType, message) {
        this.traceType = traceType;
        this.message = message;
        this.eventType = NotificationType.trace;
        if (typeof message !== 'string') {
            this.message = '';
        }
    }
}
exports.Trace = Trace;
//# sourceMappingURL=appEvents.js.map