import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ✅ Configuración para permitir acceso desde ngrok y localhost
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite acceso desde redes externas (necesario para ngrok)
    allowedHosts: [
      '*.ngrok-free.dev', // permite cualquier subdominio de ngrok
      'localhost',
      '127.0.0.1'
    ],
    // port: 5173, // (opcional) fuerza el puerto si lo necesitas fijo
  },
})
