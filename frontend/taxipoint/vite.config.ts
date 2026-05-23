import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-toastify': path.resolve(__dirname, './src/lib/popup/react-toastify.tsx'),
      'react-toastify/dist/ReactToastify.css': path.resolve(__dirname, './src/lib/popup/react-toastify.css'),
    },
  },
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://taxipoint-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'https://taxi-point.vercel.app');
          });
        },
      },
      '/login': {
        target: 'https://taxipoint-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'https://taxi-point.vercel.app');
          });
        },
      },
      '/register': {
        target: 'https://taxipoint-backend.onrender.com',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, _req, _res) => {
            proxyReq.setHeader('Origin', 'https://taxi-point.vercel.app');
          });
        },
      },
    },
  },
})
