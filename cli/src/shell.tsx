import React, { useState, FC, useEffect } from 'react';
import { Box, Text, useInput, Newline } from 'ink';
import TextInput from 'ink-text-input';
import { useAppContext } from './state/context.js';
import { useWebSocket } from './hooks/useWebSocket.js';

export const Shell: FC = () => {
  const { history, addToHistory, thinking } = useAppContext();
  const [inputValue, setInputValue] = useState<string>('');

  const { sendMessage, connectionStatus, readyState } = useWebSocket('ws://localhost:3000');

  useEffect(() => {
    // console.log('thinking.isThinking changed:', thinking.isThinking);
  }, [thinking.isThinking]);

  useInput((input: string, key: any) => {
    if (key.return) {
      // if (inputValue.trim() !== '') {
      //   addToHistory(`> ${inputValue}`);
      //   // Example of sending a message via WebSocket on Enter
      //   // sendMessage({ type: 'userInput', payload: inputValue }); 
      //   setInputValue('');
      // }
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      {/* You could display connectionStatus or readyState here if needed */}
      {/* e.g., <Text>WebSocket: {connectionStatus} (State: {readyState})</Text> */}
      {history.map((item: string, index: number) => (
        <Text key={index}>{item}</Text>
      ))}
      {!thinking.isThinking && (
        <Box>
          <Text>&gt; </Text>
          <TextInput value={inputValue} onChange={setInputValue} onSubmit={() => {
            if (inputValue.trim() !== '') {
              const messageToSend = inputValue;
              addToHistory(`> ${messageToSend}`);
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
    </Box>
  );
}; 