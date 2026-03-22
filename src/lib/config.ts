/**
 * Centralized Configuration for Venda Plus.
 * Handles environment-specific variables and platform detection.
 */

const getBaseUrl = () => {
    // If running in a native Capacitor environment (Android/iOS)
    // We MUST use a full URL, relative paths like /api will fail.

    // Detection for Capacitor
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform();

    if (isCapacitor) {
        // Production API URL for native apps
        return import.meta.env.VITE_API_URL || 'https://api.venda-plus.com';
    }

    // For Web/PWA, we can use relative paths or the current origin
    return '';
};

export const CONFIG = {
    BASE_URL: getBaseUrl(),
    IS_PRODUCTION: import.meta.env.PROD,
    API_PREFIX: '/api',
};

/**
 * Returns the full API URL for a given path.
 */
export const getFullApiUrl = (path: string) => {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    // If we have a BASE_URL (native mobile), prepend it.
    if (CONFIG.BASE_URL) {
        // Avoid double /api if path already includes it
        if (cleanPath.startsWith('/api')) {
            return `${CONFIG.BASE_URL}${cleanPath}`;
        }
        return `${CONFIG.BASE_URL}/api${cleanPath}`;
    }

    // Web/PWA case: return relative path
    return cleanPath;
};
