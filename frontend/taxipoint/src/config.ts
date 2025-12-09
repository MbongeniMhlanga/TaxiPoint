// Configuration for API Base URL
// In development, we use an empty string to allow the Vite Proxy to handle requests (and spoof CORS).
// In production, we assume the frontend is deployed to the allowed origin (https://taxi-point.vercel.app)
// and make direct requests to the backend.

export const API_BASE_URL = import.meta.env.PROD
    ? "https://taxipoint-backend.onrender.com"
    : "";
