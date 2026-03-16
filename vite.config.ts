import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // history service (:8004)
      '/api/history':          { target: process.env.HISTORY_SERVICE_URL  || 'http://localhost:8004', changeOrigin: true },
      // mypage service (:8003)
      '/api/users':           { target: process.env.MYPAGE_SERVICE_URL   || 'http://localhost:8003', changeOrigin: true },
      '/api/supplements':     { target: process.env.MYPAGE_SERVICE_URL   || 'http://localhost:8003', changeOrigin: true },
      '/dev':                 { target: process.env.MYPAGE_SERVICE_URL   || 'http://localhost:8003', changeOrigin: true },
      // chatbot service (:8002)
      '/api/chatbot':         { target: process.env.CHATBOT_SERVICE_URL  || 'http://localhost:8002', changeOrigin: true },
      '/api/auth':            { target: process.env.CHATBOT_SERVICE_URL  || 'http://localhost:8002', changeOrigin: true },
      // analysis service (:8001)
      '/api/analysis':        { target: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8001', changeOrigin: true },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
