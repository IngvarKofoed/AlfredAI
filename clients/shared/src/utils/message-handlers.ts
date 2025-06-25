import {
  ServerMessage,
  ThinkingPayload,
  QuestionFromAssistantPayload,
  ToolCallPayload
} from '../types/messages';
import {
  createAnswerEntry,
  createToolEntry,
  createElapsedTimeEntry,
  HistoryEntry
} from '../types/history';
import { ThinkingState } from '../types/state';

export interface MessageHandlerCallbacks {
  setThinking: (thinking: ThinkingState) => void;
  addToHistory: (entry: HistoryEntry) => void;
  setUserQuestions: (questions: string[]) => void;
}

export interface MessageHandlerState {
  isCurrentlyThinking: boolean;
  thinkingStartTime?: number;
}

export const createMessageHandler = (
  callbacks: MessageHandlerCallbacks,
  state: { current: MessageHandlerState }
) => {
  const { setThinking, addToHistory, setUserQuestions } = callbacks;

  return (message: ServerMessage) => {
    switch (message.type) {
      case 'thinking': {
        const payload = message.payload as ThinkingPayload;
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
        } else {
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
        const payload = message.payload as QuestionFromAssistantPayload;
        addToHistory(createAnswerEntry(payload.item));
        if (payload.questions && Array.isArray(payload.questions)) {
          setUserQuestions(payload.questions);
        }
        break;
      }
      
      case 'answerFromAssistant': {
        if (typeof message.payload === 'string') {
          addToHistory(createAnswerEntry(message.payload));
        }
        // Add elapsed time entry if we have thinking start time
        if (state.current.thinkingStartTime) {
          const elapsedSeconds = Math.floor((Date.now() - state.current.thinkingStartTime) / 1000);
          addToHistory(createElapsedTimeEntry(elapsedSeconds));
        }
        setThinking({ isThinking: false, text: '', startTime: undefined });
        state.current.thinkingStartTime = undefined;
        state.current.isCurrentlyThinking = false;
        break;
      }
      
      case 'toolCallFromAssistant': {
        const payload = message.payload as ToolCallPayload;
        addToHistory(createToolEntry(payload.tool, payload.parameters));
        break;
      }
      
      default:
        console.log('Received unhandled message type:', message.type);
    }
  };
};

export const resetThinkingState = (
  setThinking: (thinking: ThinkingState) => void,
  state: { current: MessageHandlerState }
) => {
  setThinking({ isThinking: false, text: '', startTime: undefined });
  state.current.thinkingStartTime = undefined;
  state.current.isCurrentlyThinking = false;
};