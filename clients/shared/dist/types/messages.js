"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketReadyState = void 0;
// WebSocket connection states
var WebSocketReadyState;
(function (WebSocketReadyState) {
    WebSocketReadyState[WebSocketReadyState["CONNECTING"] = 0] = "CONNECTING";
    WebSocketReadyState[WebSocketReadyState["OPEN"] = 1] = "OPEN";
    WebSocketReadyState[WebSocketReadyState["CLOSING"] = 2] = "CLOSING";
    WebSocketReadyState[WebSocketReadyState["CLOSED"] = 3] = "CLOSED";
})(WebSocketReadyState || (exports.WebSocketReadyState = WebSocketReadyState = {}));
//# sourceMappingURL=messages.js.map