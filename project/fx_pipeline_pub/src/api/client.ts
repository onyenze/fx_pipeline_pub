
// In your api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://fx-backend-service.onrender.com/api', // Your backend URL
  withCredentials: true, // Important for cookies/sessions
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;