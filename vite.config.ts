import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><defs><linearGradient id="logoGradient" x1="0%" y1="100%" x2="0%" y2="0%"><stop offset="0%" stopColor="%232563EB" /><stop offset="100%" stopColor="%232DD4BF" /></linearGradient></defs><path d="M3 19 C 8 19, 12 16, 17 16" stroke="url(%23logoGradient)" stroke-width="2.5" stroke-linecap="round" fill="none" /><path d="M3 13 C 9 13, 14 10, 20 10" stroke="url(%23logoGradient)" stroke-width="2.5" stroke-linecap="round" fill="none" /><path d="M3 7 C 10 7, 15 4, 22 4" stroke="url(%23logoGradient)" stroke-width="2.5" stroke-linecap="round" fill="none" /></svg>`;
const logoDataUrl = `data:image/svg+xml,${logoSvg}`;


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Fluxo - Financial Co-Pilot',
        short_name: 'Fluxo',
        description: 'Seu co-piloto para uma vida financeira com mais clareza, previsibilidade e confiança.',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: logoDataUrl,
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: logoDataUrl,
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})