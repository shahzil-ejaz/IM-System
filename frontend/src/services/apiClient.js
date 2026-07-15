import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`,
  timeout: 10000,
});

// Request Interceptor: Inject Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Global 401 & 403 Errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        // Clear stale credentials
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role');
        
        // Bounce user to login window cleanly
        window.location.href = '/login?error=session_expired';
      }
      
      if (status === 403) {
        console.error('Permission Denied: Insufficient user privileges.');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
