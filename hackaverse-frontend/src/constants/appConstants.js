// Application constants
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';
// VITE_API_URL preferred (local or production), fallback to VITE_API_BASE_URL.
// In dev, empty VITE_API_URL uses same-origin /api/v1 (Vite proxies to backend).
const _rawBase =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://163.128.209.18:3012';

export const API_BASE_URL = _rawBase.replace(/\/+$/, '');
export const API_TIMEOUT = 30000; // Increased to 30 seconds for cold starts

