"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const participant_1 = require("./participant");
let { remote } = require('electron');
class Call {
    constructor(call, isHost, isScreenShareControlEnabled, trace) {
        this.call = call;
        this.isScreenShareControlEnabled = isScreenShareControlEnabled;
        this.trace = trace;
        this.logPrefix = `[Call]`;
        this.participantMap = {};
        this.callbacks = [];
        this.videoContexts = {};
        this.isVideoStreamContextAvailable = false;
        this.callbacks.push(this.call.changed(() => {
            trace.info(`${this.logPrefix} Call changed: ${this.call.callId}, ${this.call}`);
            if (!isHost) {
                this.checkParticipants(this.call.participants);
                this.cleanVideoContexts();
            }
        }));
    }
    get isVideoStreamAvailable() {
        return this.isVideoStreamContextAvailable;
    }
    set isVideoStreamAvailable(value) {
        this.isVideoStreamContextAvailable = value;
    }
    stop() {
        if (this.isActiveCall()) {
            this.call.stop()
                .then(() => this.trace.info(`${this.logPrefix} Call finished, state: ${this.call.state}, reason:${this.call.terminatedReason} `))
                .catch(e => this.trace.error(`${this.logPrefix} stop failed: ${e}`));
        }
    }
    isMuted() {
        if (!this.call) {
            return true;
        }
        return (this.call.isMuted || this.call.isServerMuted);
    }
    mute() {
        if (this.isActiveCall()) {
            this.call.mute().catch(e => this.trace.error(`${this.logPrefix} mute failed: ${e}`));
        }
    }
    unmute() {
        if (this.isActiveCall()) {
            this.call.unmute().catch(e => this.trace.error(`${this.logPrefix} unmute failed: ${e}`));
        }
    }
    showWindow() {
        if (this.isVideoStreamAvailable) {
            let win = remote.getCurrentWindow();
            win.show();
        }
    }
    hideWindow() {
        let win = remote.getCurrentWindow();
        win.hide();
    }
    muteAll() {
        if (this.isActiveCall()) {
            this.call.muteParticipants(0 /* All */, []).catch(e => this.trace.error(`${this.logPrefix} muteAll failed: ${e}`));
        }
    }
    muteSpeaker() {
        if (this.isActiveCall()) {
            this.call.muteSpeaker().catch(e => this.trace.error(`${this.logPrefix} muteSpeaker failed: ${e}`));
        }
    }
    unmuteSpeaker() {
        if (this.isActiveCall()) {
            this.call.unmuteSpeaker().catch(e => this.trace.error(`${this.logPrefix} unmuteSpeaker failed: ${e}`));
        }
    }
    hold() {
        if (this.isActiveCall()) {
            this.call.hold().catch(e => this.trace.error(`${this.logPrefix} hold failed: ${e}`));
        }
    }
    unhold() {
        if (this.isActiveCall()) {
            this.call.unhold().catch(e => this.trace.error(`${this.logPrefix} unhold failed: ${e}`));
        }
    }
    reconnect() {
        if (this.call) {
            this.call.reconnect().catch(e => this.trace.error(`${this.logPrefix} reconnect failed: ${e}`));
        }
    }
    getCall() {
        return this.call;
    }
    getCallInfo() {
        if (!this.call) {
            return null;
        }
        return {
            callId: this.call.callId,
            state: this.call.state,
            threadId: this.call.threadId
        };
    }
    isActiveCall() {
        return this.call &&
            (this.call.state !== 7 /* Disconnected */) &&
            (this.call.state !== 6 /* Disconnecting */);
    }
    dispose() {
        this.trace.info(`${this.logPrefix} call wrapper dispose start`);
        if (this.call.isVideoOn) {
            this.call.stopVideo();
        }
        this.callbacks.forEach(callback => callback.dispose());
        this.call = null;
        this.cleanVideoContexts();
        Object.keys(this.participantMap).forEach(id => {
            this.trace.info(`${this.logPrefix} disposing participant with id ${id}`);
            this.participantMap[id].dispose();
        });
        this.participantMap = {};
        // Ensure screen sharing window is hidden
        // when the call is disposed
        this.hideWindow();
        this.trace.info(`${this.logPrefix} call wrapper dispose end`);
    }
    checkParticipants(participants) {
        const newParticipants = participants.filter(participant => !this.participantMap[participant.id]);
        const removedParticipants = Object.keys(this.participantMap).filter(id => !participants.filter(p => p.id === id).length);
        if (newParticipants.length) {
            this.trace.info(`${this.logPrefix} new participants: ${newParticipants}`);
            newParticipants.forEach(participant => {
                this.participantMap[participant.id] = new participant_1.default(participant, this, this.trace);
            });
        }
        if (removedParticipants.length) {
            this.trace.info(`${this.logPrefix} removed participants: ${removedParticipants}`);
            removedParticipants.forEach(id => {
                this.participantMap[id].dispose();
                delete this.participantMap[id];
            });
        }
    }
    cleanVideoContexts() {
        const unusedContexts = [];
        const streams = this.call && this.call.mediaStreams;
        for (const index of Object.keys(this.videoContexts)) {
            const usedForVideo = streams &&
                streams[0 /* Video */].some(s => s.id === Number(index));
            const usedForScreenShare = streams &&
                streams[1 /* ScreenSharing */].some(s => s.id === Number(index));
            if (!usedForVideo && !usedForScreenShare) {
                unusedContexts.push(this.videoContexts[index]); // Don't use Number() on index because it could be null/undefined
            }
        }
        for (const context of unusedContexts) {
            if (context.reset) {
                context.reset();
            }
        }
    }
}
exports.default = Call;
//# sourceMappingURL=call.js.map