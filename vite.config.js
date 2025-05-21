import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Importa el plugin PWA si está disponible
let VitePWA = null

// Usar importación dinámica (ES modules) en lugar de require
try {
  const pwaModule = await import('vite-plugin-pwa');
  VitePWA = pwaModule.VitePWA;
} catch (error) {
  // Usar el parámetro del error en el mensaje
  console.warn('vite-plugin-pwa no está disponible, la funcionalidad PWA estará desactivada:', error.message);
}

// https://vite.dev/config/
export default defineConfig({
  // Configura la base URL como '/' para despliegue en la raíz del dominio
  base: '/',
  plugins: [
    react(),
    // Usar el plugin PWA solo si está disponible
    ...(VitePWA ? [
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Conciliación Bancaria',
          short_name: 'Conciliación',
          description: 'Aplicación para realizar conciliaciones bancarias',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ] : [])
  ],
  build: {
    // Asegúrate de que el outDir coincida con lo que espera Vercel
    outDir: 'dist',
    // Genera sourcemaps para facilitar la depuración
    sourcemap: true
  }
})