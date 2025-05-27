import React, { FC } from 'react';
import { render } from 'ink';
import { AppProvider } from './state/context.js';
import { Shell } from './shell.js';

interface AppProps {
  // You might want to pass the socket URL as a prop if it's dynamic
  // socketUrl?: string;
}

const App: FC<AppProps> = (/* { socketUrl = 'ws://localhost:8080' } */) => {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
};

render(<App />); 