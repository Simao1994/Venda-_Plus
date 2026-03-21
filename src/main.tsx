import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// --- GLOBAL FETCH INTERCEPTOR FOR 401 & JWT ---
const originalFetch = window.fetch;

window.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.href;
  else if (input instanceof Request) url = input.url;

  let requestInit = init || {};

  if (url.startsWith('/api') || url.includes(window.location.origin + '/api')) {
    const token = localStorage.getItem('token') || localStorage.getItem('erp_token');

    if (token && token !== 'null' && token !== 'undefined') {
      if (input instanceof Request) {
        const newHeaders = new Headers(input.headers);
        if (!newHeaders.has('Authorization')) {
          newHeaders.set('Authorization', `Bearer ${token}`);
        }
        requestInit.headers = newHeaders;
      } else {
        const newHeaders = new Headers(requestInit.headers || {});
        if (!newHeaders.has('Authorization')) {
          newHeaders.set('Authorization', `Bearer ${token}`);
        }
        requestInit.headers = newHeaders;
      }
    }
  }

  const response = await originalFetch(input, requestInit);

  if (response.status === 401) {
    console.error('🔴 [Global Fetch] Sessão expirada ou inválida. Redirecionando...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    sessionStorage.clear();

    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  }

  return response;
};
// ----------------------------------------------

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
