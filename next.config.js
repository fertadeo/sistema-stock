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
  aggressiveFrontEndNavCaching: false,
  workboxOptions: {
    disableDevLogs: true,
    // Instalación más rápida en celular: no precachear todos los chunks de Next
    exclude: [
      /\.map$/,
      /\/_next\/static\/chunks\//,
      /\/_next\/static\/media\//,
    ],
  },
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
