import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const devPort = Number.parseInt(process.env.VITE_DEV_PORT ?? '5333', 10)
const proxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:6333'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    host: '0.0.0.0',
    port: Number.isFinite(devPort) ? devPort : 5333,
    allowedHosts: ['rag.lihsheng.space'],
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
})
