"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const appEvents_1 = require("./appEvents");
const jsonRpc_1 = require("./jsonRpc");
const traceSource_1 = require("../../tracing/traceSource");
const consoleTraceListener_1 = require("../../tracing/consoleTraceListener");
const common_1 = require("./common");
// Preload script for Electron's renderer process
console.log(`[Preload] pid: ${process.pid}`);
const { remote } = require('electron');
if (!remote.process.argv || remote.process.argv.length < 2) {
    throw new Error('[Preload] required arguments not specified');
}
const startOptions = common_1.getStartOptions(remote.process.argv[2]);
const dynamicLoader = require('dynamicloader');
const slimCore = dynamicLoader.load(startOptions.slimCorePath);
const videoRendererPath = path.join(startOptions.slimCorePath, 'lib/video-renderer');
const videoRenderer = dynamicLoader.load(videoRendererPath);
console.log(`[Preload] videoRenderer: ${videoRenderer}`);
console.log(`[Preload] JsonRPC IPC PipeName: ${startOptions.ipcPipeName}`);
const isHost = startOptions.isHost;
console.log(`[Preload] isHost: ${isHost}`);
const isScreenShareEnabled = startOptions.isScreenShareEnabled;
console.log(`[Preload] isScreenShareEnabled: ${isScreenShareEnabled}`);
const isScreenShareControlEnabled = startOptions.isScreenShareControlEnabled;
console.log(`[Preload] isScreenShareControlEnabled: ${isScreenShareControlEnabled}`);
const consoleTraceListener = new consoleTraceListener_1.ConsoleTraceListener();
traceSource_1.defaultTraceSource.addTraceListener(consoleTraceListener);
window.TraceSource = traceSource_1.defaultTraceSource;
window.SlimCore = slimCore;
window.Enums = slimCore.Enums;
window.VideoRenderer = videoRenderer;
window.StartOptions = startOptions;
const jsonRPCProxy = new jsonRpc_1.JsonRPC(startOptions.ipcPipeName, traceSource_1.defaultTraceSource);
const appEvents = new appEvents_1.AppEvents(jsonRPCProxy);
window.appEvents = appEvents;
console.log(`[Preload] Completed`);
//# sourceMappingURL=preload.js.map