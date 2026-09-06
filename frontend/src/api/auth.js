import apiClient from './client';

export async function register(email, password, name) {
  const { data } = await apiClient.post('/api/auth/register', { email, password, name });
  return data;
}

export async function login(email, password) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get('/api/auth/me');
  return data.user;
}
