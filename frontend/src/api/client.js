import axios from 'axios';

// No auth system in this class project — every request is scoped by this fixed
// demo user id, matching the backend's default when no x-user-id header is sent.
const USER_ID = 'demo-user';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000',
  headers: { 'x-user-id': USER_ID },
});

export default apiClient;
