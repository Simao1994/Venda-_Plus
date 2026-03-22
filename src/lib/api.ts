import { getFullApiUrl } from './config';

export async function apiFetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('erp_token');

    // Ensure URL is absolute if needed (mobile/capacitor)
    const finalUrl = getFullApiUrl(url);

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };

    const response = await fetch(finalUrl, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        console.error('🔴 [API] Sessão expirada ou inválida. Redirecionando...');
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        window.location.href = '/'; // Redirect to login/home
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
    }

    return response;
}

export const api = {
    get: (url: string, options?: RequestInit) => apiFetch(url, { ...options, method: 'GET' }),
    post: (url: string, body: any, options?: RequestInit) =>
        apiFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (url: string, body: any, options?: RequestInit) =>
        apiFetch(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    patch: (url: string, body: any, options?: RequestInit) =>
        apiFetch(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
    delete: (url: string, options?: RequestInit) => apiFetch(url, { ...options, method: 'DELETE' }),
};
