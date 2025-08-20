// vite.config.ts or vite.config.js in your frontend root folder
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // your frontend port
    proxy: {
      '/api': {
        target: 'https://taxipoint-backend.onrender.com', // your backend port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
