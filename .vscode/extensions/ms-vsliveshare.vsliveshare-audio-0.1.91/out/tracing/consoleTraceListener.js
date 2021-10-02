//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const traceSource_1 = require("./traceSource");
class ConsoleTraceListener extends traceSource_1.TraceListener {
    constructor() {
        super();
    }
    writeLine(line) {
    }
    writeEvent(source, eventType, id, message) {
        switch (eventType) {
            case traceSource_1.TraceEventType.Error:
                console.error(message);
                break;
            case traceSource_1.TraceEventType.Warning:
                console.warn(message);
                break;
            case traceSource_1.TraceEventType.Information:
            default:
                console.log(message);
                break;
        }
    }
}
exports.ConsoleTraceListener = ConsoleTraceListener;
//# sourceMappingURL=consoleTraceListener.js.map