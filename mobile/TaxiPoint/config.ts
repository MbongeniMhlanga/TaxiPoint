import Constants from 'expo-constants';

// Detect production vs development
const isProd = Constants.expoConfig?.releaseChannel === 'production';

// Replace PORT with your local backend port for development
const DEV_API_PORT = 5000;

// Base URL for API requests
export const API_BASE_URL = isProd
  ? 'https://taxipoint-backend.onrender.com'
  : `http://10.0.2.2:${DEV_API_PORT}`; // Android emulator localhost

// Base URL for WebSocket connections
export const WS_BASE_URL = isProd
  ? 'wss://taxipoint-backend.onrender.com/ws/incidents'
  : `ws://10.0.2.2:${DEV_API_PORT}/ws/incidents`;
