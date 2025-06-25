"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetThinkingState = exports.createMessageHandler = void 0;
const history_1 = require("../types/history");
const createMessageHandler = (callbacks, state) => {
    const { setThinking, addToHistory, setUserQuestions } = callbacks;
    return (message) => {
        switch (message.type) {
            case 'thinking': {
                const payload = message.payload;
                const isNowThinking = payload.isThinking;
                const shouldSetStartTime = !state.current.isCurrentlyThinking && isNowThinking;
                if (shouldSetStartTime) {
                    const startTime = Date.now();
                    state.current.thinkingStartTime = startTime;
                    setThinking({
                        isThinking: isNowThinking,
                        text: payload.text,
                        startTime: startTime
                    });
                }
                else {
                    setThinking({
                        isThinking: isNowThinking,
                        text: payload.text,
                        startTime: state.current.thinkingStartTime
                    });
                }
                if (!isNowThinking) {
                    state.current.thinkingStartTime = undefined;
                }
                state.current.isCurrentlyThinking = isNowThinking;
                break;
            }
            case 'questionFromAssistant': {
                const payload = message.payload;
                addToHistory((0, history_1.createAnswerEntry)(payload.item));
                if (payload.questions && Array.isArray(payload.questions)) {
                    setUserQuestions(payload.questions);
                }
                break;
            }
            case 'answerFromAssistant': {
                if (typeof message.payload === 'string') {
                    addToHistory((0, history_1.createAnswerEntry)(message.payload));
                }
                // Add elapsed time entry if we have thinking start time
                if (state.current.thinkingStartTime) {
                    const elapsedSeconds = Math.floor((Date.now() - state.current.thinkingStartTime) / 1000);
                    addToHistory((0, history_1.createElapsedTimeEntry)(elapsedSeconds));
                }
                setThinking({ isThinking: false, text: '', startTime: undefined });
                state.current.thinkingStartTime = undefined;
                state.current.isCurrentlyThinking = false;
                break;
            }
            case 'toolCallFromAssistant': {
                const payload = message.payload;
                addToHistory((0, history_1.createToolEntry)(payload.tool, payload.parameters));
                break;
            }
            default:
                console.log('Received unhandled message type:', message.type);
        }
    };
};
exports.createMessageHandler = createMessageHandler;
const resetThinkingState = (setThinking, state) => {
    setThinking({ isThinking: false, text: '', startTime: undefined });
    state.current.thinkingStartTime = undefined;
    state.current.isCurrentlyThinking = false;
};
exports.resetThinkingState = resetThinkingState;
//# sourceMappingURL=message-handlers.js.map