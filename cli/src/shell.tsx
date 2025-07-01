import React, { useState, FC, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import { useAppContext } from './state/context.js';
import { useWebSocket } from './hooks/useWebSocket.js';
import { HistoryEntry, createAnswerEntry, createUserMessageEntry } from './types.js';

export const Shell: FC = () => {
  const { history, addToHistory, thinking, reconnectTimer, userQuestions, setUserQuestions, commands } = useAppContext();
  const [inputValue, setInputValue] = useState<string>('');
  const [showQuestionSelection, setShowQuestionSelection] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customInputValue, setCustomInputValue] = useState<string>('');
  const [showCommandSuggestions, setShowCommandSuggestions] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const { sendMessage, connectionStatus, readyState } = useWebSocket('ws://localhost:3000');

  // Handle key presses for navigation
  useInput((input, key) => {
    if (showCustomInput && key.escape) {
      handleBackToSelection();
    }
    if (showCommandSuggestions && key.escape) {
      setShowCommandSuggestions(false);
    }
  });

  // Monitor input value for command autocomplete
  useEffect(() => {
    if (inputValue === '/') {
      setShowCommandSuggestions(true);
    } else if (inputValue === '' || !inputValue.startsWith('/')) {
      setShowCommandSuggestions(false);
    }
  }, [inputValue]);

  // Handle elapsed time timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (thinking.isThinking && thinking.startTime) {
      // Update elapsed time every second
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - thinking.startTime!) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      // Reset elapsed time when not thinking
      setElapsedTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [thinking.isThinking, thinking.startTime]);

  // Show question selection when userQuestions are available
  useEffect(() => {
    if (userQuestions && userQuestions.length > 0) {
      setShowQuestionSelection(true);
      setShowCustomInput(false); // Reset custom input mode
      setCustomInputValue(''); // Clear custom input
      setShowCommandSuggestions(false); // Hide command suggestions
    }
  }, [userQuestions]);

  const handleQuestionSelect = (item: { label: string; value: string }) => {
    if (item.value === '__CUSTOM_INPUT__') {
      // Switch to custom input mode
      setShowQuestionSelection(false);
      setShowCustomInput(true);
      return;
    }

    const selectedQuestion = item.value;
    addToHistory(createUserMessageEntry(selectedQuestion));
    sendMessage({ type: 'answer', payload: selectedQuestion });
    setShowQuestionSelection(false);
    setShowCustomInput(false);
    setUserQuestions([]); // Clear questions after selection
  };

  const handleCommandSelect = (item: { label: string; value: string }) => {
    const selectedCommand = item.value;
    setInputValue(selectedCommand);
    setShowCommandSuggestions(false);
    
    // Auto-submit the command
    addToHistory(createUserMessageEntry(selectedCommand));
    sendMessage({ type: 'prompt', payload: selectedCommand });
    setInputValue('');
  };

  const handleCustomInputSubmit = () => {
    if (customInputValue.trim() !== '') {
      addToHistory(createUserMessageEntry(customInputValue));
      sendMessage({ type: 'answer', payload: customInputValue });
      setShowQuestionSelection(false);
      setShowCustomInput(false);
      setCustomInputValue('');
      setUserQuestions([]); // Clear questions after custom input
    }
  };

  const handleBackToSelection = () => {
    setShowCustomInput(false);
    setShowQuestionSelection(true);
    setCustomInputValue('');
  };

  // Create question items with custom input option
  const questionItems = [
    ...(userQuestions?.map((question, index) => ({
      label: question,
      value: question,
      key: index.toString()
    })) || []),
    {
      label: '✏️  Type custom answer...',
      value: '__CUSTOM_INPUT__',
      key: 'custom'
    }
  ];

  // Create command suggestion items from dynamically received commands
  const commandItems = commands.map((cmd, index) => ({
    label: `/${cmd.name} - ${cmd.description}`,
    value: `/${cmd.name}`,
    key: index.toString()
  }));

  // Helper function to render history entry
  const renderHistoryEntry = (entry: HistoryEntry, index: number): React.ReactNode => {
    switch (entry.type) {
      case 'user':
        return (<Text color="white" key={index}>{entry.message}</Text>);
      case 'answer':
        return (<Text color="yellow" key={index}>{entry.answer}</Text>);
      case 'tool':
        return (<Text color="green" key={index}>[Tool: {entry.tool}] {JSON.stringify(entry.parameters)}</Text>);
      case 'elapsedTime':
        return (<Text color="gray" key={index}>Completed in {entry.seconds}s</Text>);
      case 'promptResponse':
        return (<Text color="blue" key={index}>{entry.response}</Text>);
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
      {!thinking.isThinking && !showQuestionSelection && !showCustomInput && !showCommandSuggestions && (
        <Box borderStyle="round" borderColor="gray" paddingLeft={1} width="100%">
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
        <Box borderStyle="round" borderColor="white" paddingLeft={1} width="100%" flexDirection="column">
            <Text>{thinking.text || 'Thinking...'}</Text>
            <Box>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Text color="gray" dimColor> Elapsed: {elapsedTime}s</Text>
            </Box>
        </Box>
      )}
      {showQuestionSelection && (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingLeft={1}>
          <Text color="cyan">Select a question (use arrows/j/k to navigate, Enter to select):</Text>
          <SelectInput items={questionItems} onSelect={handleQuestionSelect} />
        </Box>
      )}
      {showCustomInput && (
        <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingLeft={1}>
          <Text color="magenta">Type your custom answer:</Text>
          <Box>
            <Text>&gt; </Text>
            <TextInput 
              value={customInputValue} 
              onChange={setCustomInputValue} 
              onSubmit={handleCustomInputSubmit}
            />
          </Box>
          <Text color="gray" dimColor>Press Enter to submit • Press Escape to go back to selection</Text>
        </Box>
      )}
      {showCommandSuggestions && (
        <Box flexDirection="column" borderStyle="round" borderColor="blue" paddingLeft={1}>
          <Text color="blue">Available commands (use arrows to navigate, Enter to select):</Text>
          <SelectInput items={commandItems} onSelect={handleCommandSelect} />
          <Text color="gray" dimColor>Press Escape to cancel</Text>
        </Box>
      )}
    </Box>
  );
}; 