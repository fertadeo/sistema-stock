// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  scope: '/',
  sw: 'sw.js',
  disable: process.env.NODE_ENV === 'development',
  customWorkerDir: 'worker',
  cacheOnFrontEndNav: false,
  disableDevLogs: true,
  // Instalación más rápida en celular: menos archivos en precache
  buildExcludes: [/middleware-manifest\.json$/, /chunks\//, /media\//],
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200
        }
      }
    }
  ]
})

module.exports = withPWA({
    images: {
      domains: ['example.com'],  // Si usas imágenes desde dominios externos
    },

})
