import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import SystemModeHandler from './components/SystemModeHandler';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SystemModeHandler>
        <App />
      </SystemModeHandler>
    </AuthProvider>
  </StrictMode>,
);
