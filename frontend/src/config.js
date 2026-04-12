// API configuration for different environments
// In development: proxy via Vite to localhost:8000
// In APK (Capacitor): direct URL to your deployed Django server

const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;

// ⚠️ ВАЖНО: Замените на IP вашего компьютера в локальной сети
// Например: 'http://192.168.1.100:8000'
// Узнать IP: в PowerShell выполните `ipconfig` и найдите строку "IPv4"
const LOCAL_SERVER_URL = 'http://192.168.100.32:8000';

export const API_BASE = isCapacitor ? LOCAL_SERVER_URL : '';
