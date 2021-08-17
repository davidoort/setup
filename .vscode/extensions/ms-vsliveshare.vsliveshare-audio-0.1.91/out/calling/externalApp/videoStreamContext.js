"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class VideoStreamContext {
    constructor(stream) {
        this.stream = stream;
        this.starting = false;
    }
    reset() {
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = undefined;
        }
        if (this.container) {
            this.container = undefined;
        }
        this.starting = false;
    }
    init() {
        if (this.renderer || this.container) {
            this.reset();
        }
        this.container = document.createElement('div');
        this.container.id = 'remoteVideo';
        this.container.className = 'video';
        document.body.appendChild(this.container);
        this.starting = true;
    }
}
exports.default = VideoStreamContext;
//# sourceMappingURL=videoStreamContext.js.map