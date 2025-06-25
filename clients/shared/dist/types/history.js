"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElapsedTimeEntry = exports.createToolEntry = exports.createAnswerEntry = exports.createUserMessageEntry = void 0;
// Utility functions for creating history entries
const createUserMessageEntry = (message) => ({
    type: 'user',
    message
});
exports.createUserMessageEntry = createUserMessageEntry;
const createAnswerEntry = (answer) => ({
    type: 'answer',
    answer
});
exports.createAnswerEntry = createAnswerEntry;
const createToolEntry = (tool, parameters) => ({
    type: 'tool',
    tool,
    parameters
});
exports.createToolEntry = createToolEntry;
const createElapsedTimeEntry = (seconds) => ({
    type: 'elapsedTime',
    seconds
});
exports.createElapsedTimeEntry = createElapsedTimeEntry;
//# sourceMappingURL=history.js.map