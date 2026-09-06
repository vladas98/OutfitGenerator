import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
});

// Set once by AuthContext on login/logout/session-restore. Kept outside React
// state so every api/*.js call site doesn't need to thread the token through
// — the interceptor below picks up whatever the current value is.
let currentToken = null;

export function setAuthToken(token) {
  currentToken = token;
}

apiClient.interceptors.request.use((config) => {
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

export default apiClient;
