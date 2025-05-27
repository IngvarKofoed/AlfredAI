import React, { useState, FC } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useAppContext } from './state/context.js';
import { useWebSocket } from './hooks/useWebSocket.js';

export const Shell: FC = () => {
  const { history, addToHistory, thinking, reconnectTimer } = useAppContext();
  const [inputValue, setInputValue] = useState<string>('');

  const { sendMessage, connectionStatus, readyState } = useWebSocket('ws://localhost:3000');

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