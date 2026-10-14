import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base relativo para funcionar no GitHub Pages (kagayaubuyashiki.github.io/taberna-do-espectro/)
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
