import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development, /api calls are forwarded to the Python backend.
// base './' makes the built site work from any folder, including a GitHub Pages
// project site (https://<user>.github.io/<repo>/). Pages use #/ links, so this is safe.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
