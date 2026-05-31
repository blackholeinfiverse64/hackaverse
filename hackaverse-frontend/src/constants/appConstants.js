// Application constants
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';
// VITE_API_URL preferred (local or production), fallback to VITE_API_BASE_URL.
// In dev, empty VITE_API_URL uses same-origin /api/v1 (Vite proxies to backend).
const _rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '' : 'http://localhost:8000');
export const API_BASE_URL = !_rawBase
  ? '/api/v1'
  : _rawBase.endsWith('/api/v1')
    ? _rawBase
    : `${_rawBase.replace(/\/+$/, '')}/api/v1`;
export const API_TIMEOUT = 30000; // Increased to 30 seconds for cold starts
