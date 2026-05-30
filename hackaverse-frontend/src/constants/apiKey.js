// Centralized API key accessor — single source of truth
// All components MUST use this instead of hardcoding API keys
export const getApiKey = () => import.meta.env.VITE_API_KEY || '';

// Helper to build standard authenticated headers
export const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
    'X-API-Key': getApiKey(),
  };
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};
