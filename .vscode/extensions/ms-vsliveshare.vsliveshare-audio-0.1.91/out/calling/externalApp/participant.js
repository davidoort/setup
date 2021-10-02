"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const videoStreamContext_1 = require("./videoStreamContext");
const constants_1 = require("./constants");
let { remote } = require('electron');
class Participant {
    constructor(participant, call, trace) {
        this.participant = participant;
        this.call = call;
        this.trace = trace;
        this.logPrefix = `[Participant]`;
        this.videoContexts = [];
        this.screenShareContext = new videoStreamContext_1.default(null);
        this.trace.info(`${this.logPrefix} Adding new participant with id: ${participant.id}, isScreenShareControlEnabled: ${call.isScreenShareControlEnabled}`);
        // If the remote pointer image isn't set an exception is thrown when injecting raw input
        if (call.isScreenShareControlEnabled) {
            const screenSharingControl = call.getCall().screenSharingControl;
            screenSharingControl.setRemotePointerImage(participant, constants_1.avatarBase64);
            this.checkStreams();
        }
        this.changedCallback = this.participant.changed(() => {
            trace.info(`${this.logPrefix} participant changed: ${this.participant.id} ${this.participant.state}`);
            this.checkStreams();
        });
    }
    dispose() {
        this.trace.info(`${this.logPrefix} Disposing participant ${this.participant.id}`);
        _.each(this.videoContexts, context => this.removeContext(context));
        this.screenShareContext.reset();
        this.changedCallback.dispose();
        this.participant = null;
    }
    removeContext(context) {
        if (context.reset) {
            context.reset();
        }
        _.remove(this.videoContexts, ctx => ctx === context);
    }
    getContext(streamId) {
        return _.find(this.videoContexts, ctx => ctx.stream.id === streamId);
    }
    checkContext(context) {
        this.trace.info(`${this.logPrefix} check context start`);
        if (context && context.stream) {
            this.trace.info(`${this.logPrefix} isAvailable: ${context.stream.isAvailable}, context.renderer: ${context.renderer}, context.starting: ${context.starting}`);
            if (context.stream.isAvailable && !context.renderer && !context.starting) {
                this.trace.info(`${this.logPrefix} Participant ${this.participant.id} stream ID ${context.stream.id} available, starting...`);
                context.init();
                context.stream.start(context.container).then(renderer => {
                    context.starting = false;
                    context.renderer = renderer;
                    this.trace.info(`${this.logPrefix} setRenderer on screen sharing control`);
                    const screenSharingControl = (this.call.getCall().screenSharingControl);
                    screenSharingControl.setRenderer(renderer);
                    renderer.on('videoSizeChanged', (width, height) => {
                        this.trace.info(`${this.logPrefix} videoSizeChanged queued: renderer${width} size:${height}`);
                        let currentWindow = remote.getCurrentWindow();
                        currentWindow.setSize(width, height + 30, true);
                    });
                    this.trace.info(`${this.logPrefix} show screen share window`);
                    this.call.isVideoStreamAvailable = true;
                    this.call.showWindow();
                    this.trace.info(`${this.logPrefix} Participant ${this.participant.id} new remote renderer: ${renderer}`);
                }).catch(e => this.trace.error(`${this.logPrefix} Unable to start participant ${this.participant.id} video stream: ${e}`));
            }
            else if (context && !context.stream.isAvailable && context.renderer) {
                this.trace.info(`${this.logPrefix} Participant ${this.participant.id} removing renderer`);
                this.call.isVideoStreamAvailable = false;
                this.call.hideWindow();
                this.removeContext(context);
            }
        }
        this.trace.info(`${this.logPrefix} check context end`);
    }
    checkStreams() {
        this.trace.info(`${this.logPrefix} checkStreams start`);
        // After reconnecting in a group call, the renderer has a new stream.id, and the old one removed.
        for (const context of this.videoContexts) {
            if (context && context.renderer && !this.participant.streams[0 /* Video */].some(x => x.id === context.stream.id)) {
                this.trace.info(`${this.logPrefix} Participant ${this.participant.id} removing obsolete renderer`);
                this.removeContext(context);
            }
        }
        this.participant.streams[0 /* Video */].forEach(stream => {
            let context = this.getContext(stream.id);
            this.trace.info(`${this.logPrefix} Adding video stream context: context: ${context}, isStreamAvailable: ${stream.isAvailable}`);
            if (!context && stream.isAvailable) {
                // Do not add a video stream if it's not available.
                context = new videoStreamContext_1.default(stream);
                this.videoContexts.push(context);
            }
            this.checkContext(context);
        });
        this.screenShareContext.stream = _.head(this.participant.streams[1 /* ScreenSharing */]);
        this.checkContext(this.screenShareContext);
        this.trace.info(`${this.logPrefix} checkStreams end`);
    }
}
exports.default = Participant;
//# sourceMappingURL=participant.js.map