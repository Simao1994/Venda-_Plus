import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

import { getFullApiUrl } from './lib/config';

// --- REGISTER SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// --- GLOBAL FETCH INTERCEPTOR FOR 401 & JWT ---
const originalFetch = window.fetch;

window.fetch = async (input, init) => {
  let url = '';
  if (typeof input === 'string') url = input;
  else if (input instanceof URL) url = input.href;
  else if (input instanceof Request) url = input.url;

  let requestInit = init || {};

  // Resolve absolute API URL for mobile/native
  const finalUrl = getFullApiUrl(url);

  if (finalUrl.includes('/api')) {
    const token = localStorage.getItem('token') || localStorage.getItem('erp_token');

    let finalHeaders = new Headers(init?.headers || {});
    if (input instanceof Request) {
      finalHeaders = new Headers(input.headers);
    }

    if (finalHeaders.has('Authorization')) {
      const authVal = finalHeaders.get('Authorization');
      if (authVal === 'Bearer null' || authVal === 'Bearer undefined' || !authVal) {
        finalHeaders.delete('Authorization');
      }
    }

    if (token && token !== 'null' && token !== 'undefined') {
      if (!finalHeaders.has('Authorization')) {
        finalHeaders.set('Authorization', `Bearer ${token}`);
      }
    }

    requestInit.headers = finalHeaders;
  }

  const response = await originalFetch(finalUrl, requestInit);

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
