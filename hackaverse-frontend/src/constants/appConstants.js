// Application constants
export const AUTH_TOKEN_KEY = 'authToken';
export const USER_DATA_KEY = 'userData';
// VITE_API_URL preferred (local or production), fallback to VITE_API_BASE_URL, then localhost.
// All API calls go through the /api/v1 versioned namespace for deterministic routing.
const _rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_BASE_URL = _rawBase.endsWith('/api/v1') ? _rawBase : `${_rawBase.replace(/\/+$/, '')}/api/v1`;
export const API_TIMEOUT = 30000; // Increased to 30 seconds for cold starts
