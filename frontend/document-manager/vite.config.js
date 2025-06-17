import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Allow external connections
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🚨 Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('📤 Sending Request to Backend:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 Received Response from Backend:', proxyRes.statusCode, req.url);
          });
        }
      }
    }
  },
  // Add environment variable support
  define: {
    __VITE_API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000')
  }
})
