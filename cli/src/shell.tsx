import React, { useState, FC, useEffect } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { useAppContext } from './state/context.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { HistoryEntry, createAnswerEntry, createUserMessageEntry } from './types.js';

export const Shell: FC = () => {
  const { history, addToHistory, thinking, reconnectTimer, userQuestions, setUserQuestions } = useAppContext();
  const [inputValue, setInputValue] = useState<string>('');
  const [showQuestionSelection, setShowQuestionSelection] = useState<boolean>(false);

  const { sendMessage, connectionStatus, readyState } = useWebSocket('ws://localhost:3000');

  // Show question selection when userQuestions are available
  useEffect(() => {
    if (userQuestions && userQuestions.length > 0) {
      setShowQuestionSelection(true);
    }
  }, [userQuestions]);

  const handleQuestionSelect = (item: { label: string; value: string }) => {
    const selectedQuestion = item.value;
    addToHistory(createUserMessageEntry(selectedQuestion));
    sendMessage({ type: 'answer', payload: selectedQuestion });
    setShowQuestionSelection(false);
    setUserQuestions([]); // Clear questions after selection
  };

  const questionItems = userQuestions?.map((question, index) => ({
    label: question,
    value: question,
    key: index.toString()
  })) || [];

  // Helper function to render history entry
  const renderHistoryEntry = (entry: HistoryEntry, index: number): React.ReactNode => {
    switch (entry.type) {
      case 'user':
        return (<Text color="white" key={index}>{entry.message}</Text>);
      case 'answer':
        return (<Text color="yellow" key={index}>{entry.answer}</Text>);
      case 'tool':
        return (<Text color="green" key={index}>[Tool: {entry.tool}] {JSON.stringify(entry.parameters)}</Text>);
      default:
        // This should never happen with proper typing, but provides a fallback
        return (<Text color="red" key={index}>ERROR: Unknown history entry type</Text>);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      {connectionStatus != 'Open' && (
        <Box borderStyle="round" borderColor="redBright" paddingLeft={1}>
          <Text color="redBright">
            Disconnected from server ({connectionStatus})
            {reconnectTimer > 0 && ` - Retrying in ${reconnectTimer}s...`}
          </Text>
        </Box>
      )}
      {history.map((item: HistoryEntry, index: number) => (
        renderHistoryEntry(item, index)
      ))}
      {!thinking.isThinking && (
        <Box>
          <Text>&gt; </Text>
          <TextInput value={inputValue} onChange={setInputValue} onSubmit={() => {
            if (inputValue.trim() !== '') {
              const messageToSend = inputValue;
              addToHistory(createUserMessageEntry(messageToSend));
              // Send the input value via WebSocket
              sendMessage({ type: 'prompt', payload: messageToSend }); 
              setInputValue('');
            }
          }} />
        </Box>
      )}
      {thinking.isThinking && (
        <Box borderStyle="round" borderColor="white" paddingLeft={1} width="100%">
            <Text>{thinking.text || 'Thinking...'}</Text>
        </Box>
      )}
      {showQuestionSelection && (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingLeft={1}>
          <Text color="cyan">Select a question (use arrows/j/k to navigate, Enter to select, or press number key):</Text>
          <SelectInput items={questionItems} onSelect={handleQuestionSelect} />
        </Box>
      )}
    </Box>
  );
}; 