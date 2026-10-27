import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const foodSrc = path.resolve(__dirname, './src/modules/Food')
const servicesApi = path.resolve(__dirname, './src/services/api')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ViteImageOptimizer({
      exclude: /(quicky-spicy-logo|offerimage|collectionspagebanner|loginbanner|bikelogo|logo\.png)/,
    })
  ],
  resolve: {
    alias: {
      // More specific first so @food/api/* resolves to services (no backend)
      '@food/api/axios': path.resolve(servicesApi, 'axios.js'),
      '@food/api/config': path.resolve(servicesApi, 'config.js'),
      '@food/api': servicesApi,
      '@food': foodSrc,
      '@delivery': path.resolve(__dirname, './src/modules/DeliveryV2'),
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  optimizeDeps: {
    entries: [
      'index.html',
      'src/**/*.{js,jsx}',
    ],
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/x-date-pickers',
      'firebase/app',
      'firebase/auth',
      'firebase/database',
      'firebase/messaging',
      'date-fns',
      'dayjs',
      'lucide-react',
      'framer-motion',
      'zustand',
      'zustand/middleware',
      'sonner',
      '@react-google-maps/api',
      '@googlemaps/js-api-loader',
      'axios',
      'antd',
      'jspdf',
      'jspdf-autotable',
      'html2canvas',
      'recharts',
      'leaflet',
      'react-leaflet',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'canvas-confetti',
      'file-saver',
      'socket.io-client',
      '@reduxjs/toolkit',
      'react-redux',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Backend API (default 5005)
      '/api/v1': {
        target: process.env.VITE_BACKEND_PROXY_TARGET || 'http://localhost:5005',
        changeOrigin: true,
      },
    },
  },
});
