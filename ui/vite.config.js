import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 배포 환경에서 base 경로 설정 (필요 시)
  // base: '/',
  optimizeDeps: {
    include: ['heic2any'],
    exclude: []
  },
  build: {
    commonjsOptions: {
      include: [/heic2any/, /node_modules/],
      transformMixedEsModules: true
    },
    // 빌드 최적화 설정
    minify: 'esbuild',
    sourcemap: false, // 프로덕션에서는 소스맵 비활성화 (보안)
    rollupOptions: {
      output: {
        // 청크 파일명 최적화
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react'],
          'image-vendor': ['html2canvas', 'jspdf', 'react-easy-crop']
        }
      }
    }
  }
})
