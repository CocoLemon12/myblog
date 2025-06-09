import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/xafrnk/',
  server: {
    host: true, 
    port: 5173
  }
})