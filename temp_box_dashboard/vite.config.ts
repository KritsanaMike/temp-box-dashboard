import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/demo-temp-box/', 
  plugins: [react()],
  server: {
    port: 8888, // Replace with your desired port number
    host: '0.0.0.0', // Allow access from any IP address
  },
})
