import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://localhost:8000/api/';

const normalizeApiBaseUrl = (url: string) => {
  const trimmedUrl = url.trim();
  return trimmedUrl.endsWith('/') ? trimmedUrl : `${trimmedUrl}/`;
};

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const API_ORIGIN = new URL(API_BASE_URL).origin;

export const resolveMediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

// Intercepteur pour ajouter le token JWT
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

// Intercepteur pour gérer les erreurs 401 (token expiré)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (err) {
          // Si le refresh token est expiré aussi, déconnexion
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
