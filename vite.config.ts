import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from 'unocss/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue(), unocss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.API_PORT || 3456}`,
        changeOrigin: true,
      },
    },
  },
})
