import axios from 'axios';

/**
 * localApi.js - API Client Edition
 * Фронтенд работает напрямую с вашим Django-сервером через Axios.
 * Все SQL-запросы теперь выполняются на стороне сервера в MySQL.
 */

// Определяем базовый URL для APK и веб-версии
const RENDER_URL = 'https://ira-project-ep8l.onrender.com';

const API_BAR = (window.Capacitor || window.location.hostname !== 'localhost')
    ? `${RENDER_URL}/api`
    : 'http://localhost:8000/api';

// Настройка axios для работы с Django (куки, заголовки)
axios.defaults.withCredentials = true;

const STORAGE_KEYS = {
  USER: 'yugra_user'
};

const getStorage = (key, def = []) => {
  const item = localStorage.getItem(key);
  try { return item ? JSON.parse(item) : def; } catch { return def; }
};

export const localApi = {
  // Авторизация (через сервер)
  getCurrentUser: async () => {
    try {
      const res = await axios.get(`${API_BAR}/current_user/`);
      return res.data;
    } catch {
      return null;
    }
  },

  login: async (username, password) => {
    const res = await axios.post(`${API_BAR}/login/`, { username, password });
    return res.data;
  },

  register: async (data) => {
    const res = await axios.post(`${API_BAR}/register/`, data);
    return res.data;
  },

  // Данные (через сервер)
  getFeed: async () => {
    const res = await axios.get(`${API_BAR}/feed/`);
    return res.data;
  },

  getObjects: async (searchText = '', category = '') => {
    const res = await axios.get(`${API_BAR}/objects/`, {
      params: { q: searchText, category: category }
    });
    return res.data;
  },

  getLocation: async (id) => {
    const res = await axios.get(`${API_BAR}/location/${id}/`);
    return res.data;
  },

  getRoutes: async () => {
    const res = await axios.get(`${API_BAR}/routes/`);
    return res.data;
  },

  // Действия (сохраняются в MySQL через сервер)
  toggleFavorite: async (id) => {
    const res = await axios.post(`${API_BAR}/toggle_favorite/${id}/`);
    return res.data;
  },

  toggleVisited: async (id) => {
    const res = await axios.post(`${API_BAR}/toggle_visited/${id}/`);
    return res.data;
  },

  addReview: async (locId, rating, text) => {
    const res = await axios.post(`${API_BAR}/location/${locId}/`, { rating, text });
    return res.data;
  },

  getProfile: async () => {
    const res = await axios.get(`${API_BAR}/profile/`);
    return res.data;
  },

  getWeather: async (cityIdx = 0) => {
    const res = await axios.get(`${API_BAR}/weather/`, {
      params: { city: cityIdx }
    });
    return res.data;
  },

  getEvent: async (id) => {
    const res = await axios.get(`${API_BAR}/event/${id}/`);
    return res.data;
  },

  addEventReview: async (eventId, rating, text) => {
    const res = await axios.post(`${API_BAR}/event/${eventId}/`, { rating, text });
    return res.data;
  }
};
