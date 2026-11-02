import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Escucha también en la red local, para abrir la Vista Cliente desde el celular (misma red WiFi).
    host: true,
    port: 5173,
    strictPort: true,
  },
})
