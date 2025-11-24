import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['heic2any'],
    exclude: []
  },
  build: {
    commonjsOptions: {
      include: [/heic2any/, /node_modules/],
      transformMixedEsModules: true
    }
  }
})
