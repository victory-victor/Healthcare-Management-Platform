import axios from 'axios';

const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const api = axios.create({
  baseURL: `${apiBase}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('medai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh or unauthorized error
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('medai_refresh_token');
        if (refreshToken) {
          const res = await axios.post(`${apiBase}/api/auth/refresh`, { refreshToken });
          if (res.data?.token) {
            localStorage.setItem('medai_token', res.data.token);
            if (res.data.refreshToken) {
              localStorage.setItem('medai_refresh_token', res.data.refreshToken);
            }
            originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshErr) {
        localStorage.removeItem('medai_token');
        localStorage.removeItem('medai_refresh_token');
        localStorage.removeItem('medai_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
