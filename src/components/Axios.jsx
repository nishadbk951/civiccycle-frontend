import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://civiccyle-backend.onrender.com/api/',
  timeout: 45000,
});

API.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isPublicAuthRoute = url.includes('login/') || url.includes('register/');

    if (!isPublicAuthRoute && !config.headers.Authorization) {
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isOnAuthPage =
      window.location.pathname.includes('/login') ||
      window.location.pathname.includes('/register');

    if (status === 401 && !isOnAuthPage) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;