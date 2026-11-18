import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/NASUNJIN.github.io/',
  plugins: [vue(), tailwindcss()],
  server: {
    port: 4173,
  },
  preview: { port: 4173 },
})
