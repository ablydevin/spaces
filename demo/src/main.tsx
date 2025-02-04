import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { SpaceContextProvider } from './components';
import { SlidesStateContextProvider } from './components/SlidesStateContext.tsx';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <SpaceContextProvider>
      <SlidesStateContextProvider>
        <App />
      </SlidesStateContextProvider>
    </SpaceContextProvider>
  </React.StrictMode>,
);
