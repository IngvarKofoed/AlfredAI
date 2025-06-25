"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = void 0;
const react_1 = require("react");
const websocket_client_1 = require("./websocket-client");
const messages_1 = require("../types/messages");
const RECONNECT_DELAY_SECONDS = 5;
const useWebSocket = (socketUrl, options = {}) => {
    const [lastJsonMessage, setLastJsonMessage] = (0, react_1.useState)(null);
    const [readyState, setReadyState] = (0, react_1.useState)(messages_1.WebSocketReadyState.CONNECTING);
    const [attemptReconnect, setAttemptReconnect] = (0, react_1.useState)(false);
    const [reconnectAttempt, setReconnectAttempt] = (0, react_1.useState)(0);
    const [reconnectTimer, setReconnectTimer] = (0, react_1.useState)(0);
    const clientRef = (0, react_1.useRef)(null);
    const { onMessage, onOpen, onClose, onError, shouldReconnect = true } = options;
    const createClient = (0, react_1.useCallback)(() => {
        const callbacks = {
            onOpen: () => {
                setReadyState(messages_1.WebSocketReadyState.OPEN);
                setAttemptReconnect(false);
                setReconnectTimer(0);
                onOpen?.();
            },
            onClose: (code, reason) => {
                setReadyState(messages_1.WebSocketReadyState.CLOSED);
                if (shouldReconnect) {
                    setAttemptReconnect(true);
                    setReconnectTimer(RECONNECT_DELAY_SECONDS);
                }
                onClose?.();
            },
            onError: (error) => {
                setReadyState(messages_1.WebSocketReadyState.CLOSED);
                if (shouldReconnect) {
                    setAttemptReconnect(true);
                    setReconnectTimer(RECONNECT_DELAY_SECONDS);
                }
                onError?.(error);
            },
            onMessage: (message) => {
                setLastJsonMessage(message);
                onMessage?.(message);
            }
        };
        return new websocket_client_1.WebSocketClient(socketUrl, callbacks);
    }, [socketUrl, onMessage, onOpen, onClose, onError, shouldReconnect]);
    (0, react_1.useEffect)(() => {
        if (!socketUrl) {
            return;
        }
        clientRef.current = createClient();
        clientRef.current.connect();
        setReadyState(messages_1.WebSocketReadyState.CONNECTING);
        setReconnectTimer(0);
        return () => {
            if (clientRef.current) {
                clientRef.current.disconnect();
                clientRef.current = null;
            }
            setReadyState(messages_1.WebSocketReadyState.CLOSED);
        };
    }, [socketUrl, createClient, reconnectAttempt]);
    // Effect for handling reconnect timer
    (0, react_1.useEffect)(() => {
        let timerId;
        if (attemptReconnect && readyState === messages_1.WebSocketReadyState.CLOSED && reconnectTimer > 0) {
            timerId = setInterval(() => {
                setReconnectTimer((prev) => prev - 1);
            }, 1000);
        }
        else if (reconnectTimer === 0 && attemptReconnect && readyState === messages_1.WebSocketReadyState.CLOSED) {
            setAttemptReconnect(false);
            setReconnectAttempt((prev) => prev + 1);
        }
        return () => {
            if (timerId) {
                clearInterval(timerId);
            }
        };
    }, [attemptReconnect, readyState, reconnectTimer]);
    const sendMessage = (0, react_1.useCallback)((message) => {
        if (clientRef.current?.isConnected()) {
            clientRef.current.sendMessage(message);
        }
        else {
            console.warn('WebSocket is not open. Message not sent:', message);
        }
    }, []);
    const connectionStatus = clientRef.current?.getConnectionStatus() || 'Closed';
    return {
        sendMessage,
        connectionStatus,
        lastJsonMessage,
        readyState,
        reconnectTimer
    };
};
exports.useWebSocket = useWebSocket;
//# sourceMappingURL=use-websocket-hook.js.map