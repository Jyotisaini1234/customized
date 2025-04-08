// src/index.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { Theme } from './Theme/theme.tsx';
import { BrowserRouter } from 'react-router-dom';
import initStore from './store/store.tsx';
import App from './App.tsx';

const preloadedState = (window as any).__PRELOADED_STATE__;
const store = initStore(preloadedState);

const indexJSX = (
  <ThemeProvider theme={Theme}>
    <Provider store={store}>
      <HelmetProvider>
        <BrowserRouter>
            <App/>
        </BrowserRouter>
      </HelmetProvider>
    </Provider>
  </ThemeProvider>
);

const container = document.getElementById('root');
createRoot(container!).render(indexJSX);
