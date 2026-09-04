import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/ocean-explorer-3d-v2/',
  server: {
    port: 5173,
    host: true
  }
})
