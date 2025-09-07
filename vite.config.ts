import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all envs (no prefix restriction here since this file runs on the server side)
  const env = loadEnv(mode, process.cwd(), '')

  const devPort = Number(env.VITE_DEV_PORT || 5173)
  const apiUrl = env.VITE_API_URL
  const apiHost = env.VITE_API_HOST || 'http://localhost'
  const apiPort = env.VITE_API_PORT || env.PORT || '5174'
  const target = apiUrl || `${apiHost}:${apiPort}`

  return {
    plugins: [react()],
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
    // Avoid pre-bundling ffmpeg packages which ship workers/wasm
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util', '@ffmpeg/core']
    },
    // Ensure .wasm is served with correct mime and included by Vite
    assetsInclude: ['**/*.wasm'],
  }
})
