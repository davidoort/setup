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
const IMessagingService_1 = require("./IMessagingService");
const vscode_1 = require("vscode");
const traceSource_1 = require("../tracing/traceSource");
class HostMessagingService extends vscode_1.EventEmitter {
    constructor(liveShare) {
        super();
        this.liveShare = liveShare;
        this.onNotificationReceived = (message) => {
            this.trace.info(`onNotificationReceived: ${JSON.stringify(message)}`);
            //fan out notification to everybody
            this.fire(message);
        };
        this.trace = traceSource_1.defaultTraceSource.withName('HostMessagingService');
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.shareService = yield this.liveShare.shareService(IMessagingService_1.MessagingServiceName);
            this.shareService.onNotify(IMessagingService_1.MessagingServiceNotificationEventName, this.onNotificationReceived);
        });
    }
    fire(event) {
        if (!event) {
            this.trace.error(`Cannot emit a null event`);
            throw new Error('Cannot emit a null event');
        }
        if (!this.shareService || !this.shareService.isServiceAvailable) {
            this.trace.error('SharedService not available');
            return;
        }
        //notify everybody else
        this.shareService.notify(IMessagingService_1.MessagingServiceNotificationEventName, event);
        //notify subscribers about this event (self)
        super.fire(event);
    }
}
exports.HostMessagingService = HostMessagingService;
//# sourceMappingURL=HostMessagingService.js.map