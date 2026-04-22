import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: Number.parseInt(process.env.WATCHTOWER_FRONTEND_PORT ?? '5173', 10),
    proxy: {
      '/api': {
        target: process.env.WATCHTOWER_API_BASE_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
      '/health': {
        target: process.env.WATCHTOWER_API_BASE_URL ?? 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
