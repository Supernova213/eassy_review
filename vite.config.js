import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true
  },
  base: process.env.NODE_ENV === 'production' ? '/eassy_review/' : '/',
  build: {
    outDir: 'docs',
    assetsDir: 'assets'
  }
})
