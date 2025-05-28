import { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../state/context.js';
import WebSocket from 'ws'; // Import the 'ws' library

// Define the expected message format from the server
interface ServerMessage {
  type: string;
  payload: any;
}

// Define our own ReadyState equivalent (matches 'ws' library's states)
enum WebSocketReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}

const RECONNECT_DELAY_SECONDS = 5;

export const useWebSocket = (socketUrl: string) => {
  const { setThinking, addToHistory, setReconnectTimer, reconnectTimer, setUserQuestions } = useAppContext();
  const [lastJsonMessage, setLastJsonMessage] = useState<ServerMessage | null>(null);
  const [readyState, setReadyState] = useState<WebSocketReadyState>(WebSocketReadyState.CONNECTING);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [attemptReconnect, setAttemptReconnect] = useState<boolean>(false);
  const [reconnectAttempt, setReconnectAttempt] = useState<number>(0);

  useEffect(() => {
    if (!socketUrl) {
      return;
    }

    // Use the imported WebSocket from 'ws'
    const ws = new WebSocket(socketUrl);
    setSocket(ws);
    setReadyState(WebSocketReadyState.CONNECTING);
    setReconnectTimer(0); // Reset timer on new connection attempt
    ws.on('open', () => { // 'ws' library uses 'open' event, not onopen property
      setReadyState(WebSocketReadyState.OPEN);
      setAttemptReconnect(false); // Reset reconnect flag on successful connection
      setReconnectTimer(0);
    });

    ws.on('close', (code: number, reason: Buffer) => { // 'ws' uses 'close' event, reason is a Buffer
      setReadyState(WebSocketReadyState.CLOSED);
      setAttemptReconnect(true);
      setReconnectTimer(RECONNECT_DELAY_SECONDS);
    });

    ws.on('error', (err: Error) => { // 'ws' uses 'error' event, argument is an Error
      setReadyState(WebSocketReadyState.CLOSED);
      setThinking({ isThinking: false, text: '' }); // Ensure thinking state is reset on error
      setAttemptReconnect(true);
      setReconnectTimer(RECONNECT_DELAY_SECONDS);
    });

    ws.on('message', (data: WebSocket.RawData, isBinary: boolean) => { // 'ws' uses 'message' event
      if (!isBinary) {
        const messageData = data.toString(); // Convert Buffer/ArrayBuffer to string
        try {
          const message = JSON.parse(messageData) as ServerMessage;
          setLastJsonMessage(message);

          switch (message.type) {
            case 'thinking':
              setThinking({ isThinking: message.payload.isThinking, text: message.payload.text });
              break;
            case 'questionFromAssistant':
              addToHistory(message.payload.item);
              // Set user questions if they exist in the payload
              if (message.payload.questions && Array.isArray(message.payload.questions)) {
                setUserQuestions(message.payload.questions);
              }
              break;
            case 'answerFromAssistant':
              if (typeof message.payload === 'string') {
                addToHistory(message.payload);
              }
              setThinking({ isThinking: false, text: '' });
              break;
            default:
              console.log('Received unhandled message type:', message.type);
          }
        } catch (e) {
          console.error('Error parsing WebSocket message or handling it:', e);
          addToHistory(`Raw message: ${messageData}`);
          setThinking({ isThinking: false, text: '' });
        }
      } else {
        console.log('Received binary message.');
        // Handle binary data if necessary, e.g., data as Buffer
        let binaryDataLength = 0;
        if (data instanceof Buffer) {
          binaryDataLength = data.length;
        } else if (data instanceof ArrayBuffer) {
          binaryDataLength = data.byteLength;
        } else if (Array.isArray(data)) { // Buffer[]
          binaryDataLength = data.reduce((sum, buf) => sum + buf.length, 0);
        }
        addToHistory(`Received binary message of length: ${binaryDataLength}`);
        setThinking({ isThinking: false, text: '' });
      }
    });

    // Cleanup function
    return () => {
      // Check readyState from 'ws' instance which uses numeric values
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      setReadyState(WebSocketReadyState.CLOSED);
      setSocket(null); // Clear the socket state
    };
  }, [socketUrl, setThinking, addToHistory, setReconnectTimer, reconnectAttempt]); // Added reconnectAttempt

  // Effect for handling reconnect timer
  useEffect(() => {
    let timerId: NodeJS.Timeout | undefined;
    if (attemptReconnect && readyState === WebSocketReadyState.CLOSED && reconnectTimer > 0) {
      timerId = setInterval(() => {
        setReconnectTimer(reconnectTimer - 1);
      }, 1000);
    } else if (reconnectTimer === 0 && attemptReconnect && readyState === WebSocketReadyState.CLOSED) {
      setAttemptReconnect(false); // Reset for the next cycle if needed
      setReconnectAttempt(prev => prev + 1); // Trigger main effect to reconnect
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
      }
    };
  }, [attemptReconnect, readyState, reconnectTimer, setReconnectTimer, setReconnectAttempt]); // Dependencies updated

  const sendMessage = useCallback((message: string | object) => {
    // Check readyState from 'ws' instance
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageToSend);
    } else {
      console.warn('WebSocket is not open. Message not sent:', message);
    }
  }, [socket]); // socket dependency now refers to the 'ws' WebSocket instance

  const connectionStatus = {
    [WebSocketReadyState.CONNECTING]: 'Connecting',
    [WebSocketReadyState.OPEN]: 'Open',
    [WebSocketReadyState.CLOSING]: 'Closing',
    [WebSocketReadyState.CLOSED]: 'Closed',
  }[readyState];

  return { sendMessage, connectionStatus, lastJsonMessage, readyState };
}; 