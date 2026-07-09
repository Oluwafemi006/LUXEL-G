import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

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
  },
});

const getApiPath = (url?: string) => {
  if (!url) return '';
  const normalizedUrl = url.startsWith(API_BASE_URL)
    ? url.slice(API_BASE_URL.length)
    : url.replace(/^\/+/, '');
  return normalizedUrl;
};

const isClientRequest = (url?: string) => getApiPath(url).startsWith('client-space/');

export const fetchAllPages = async <T>(url: string, config: AxiosRequestConfig = {}): Promise<T[]> => {
  const separator = url.includes('?') ? '&' : '?';
  let nextUrl: string | null = `${url}${separator}page_size=500`;
  const items: T[] = [];

  while (nextUrl) {
    const requestUrl = nextUrl;
    const response: AxiosResponse<T[] | { results?: T[]; next?: string | null }> = await api.get(requestUrl, config);
    if (Array.isArray(response.data)) {
      items.push(...response.data);
      nextUrl = null;
    } else {
      items.push(...(response.data.results ?? []));
      nextUrl = response.data.next ?? null;
      if (nextUrl) {
        nextUrl = nextUrl.startsWith(API_BASE_URL)
          ? nextUrl.slice(API_BASE_URL.length)
          : nextUrl;
      }
    }
  }

  return items;
};

// Intercepteur pour ajouter le token JWT approprié (Client ou Staff)
api.interceptors.request.use(
  (config) => {
    // Les requêtes de l'espace client passent uniquement par client-space/.
    const isClient = isClientRequest(config.url);
    const tokenKey = isClient ? 'client_access_token' : 'staff_access_token';
    const token = localStorage.getItem(tokenKey);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs 401 (token expiré) et réseau
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 1. Gestion des erreurs réseau
    if (!error.response && error.isAxiosError) {
      console.error("Erreur réseau globale :", error.message);
      window.dispatchEvent(new CustomEvent('network_error', { detail: 'Connexion au serveur perdue. Veuillez vérifier votre connexion internet.' }));
      return Promise.reject(error);
    }

    const originalRequest = error.config;
    
    // Ignorer les requêtes d'authentification pour éviter les boucles
    if (originalRequest.url?.includes('token/') || originalRequest.url?.includes('client-space/verify_otp/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const isClient = isClientRequest(originalRequest.url);
      const prefix = isClient ? 'client' : 'staff';
      
      const refreshToken = localStorage.getItem(`${prefix}_refresh_token`);
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}token/refresh/`, { refresh: refreshToken });
          localStorage.setItem(`${prefix}_access_token`, response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (err) {
          // Si le refresh token est expiré
          localStorage.removeItem(`${prefix}_access_token`);
          localStorage.removeItem(`${prefix}_refresh_token`);
          
          if (!isClient) {
             window.location.href = '/login'; // Rediriger l'admin
          } else {
             window.dispatchEvent(new CustomEvent('client_auth_error')); // Notifier l'espace client
          }
        }
      } else {
        if (!isClient) {
          window.location.href = '/login';
        } else {
          window.dispatchEvent(new CustomEvent('client_auth_error'));
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
