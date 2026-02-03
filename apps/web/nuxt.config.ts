export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:8000'
    }
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  modules: [
    '@nuxt/ui',
    '@nuxtjs/supabase',
    '@vite-pwa/nuxt',
    '@nuxt/eslint'
  ],

  css: ['~/assets/css/main.css'],

  ui: {
    global: true
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    storageKey: 'sportia-color-mode'
  },

  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/',
      include: undefined,
      exclude: ['/register', '/forgot-password', '/reset-password'],
      cookieRedirect: true,
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'SPORTIA',
      short_name: 'SPORTIA',
      description: 'Plataforma de Gestión Deportiva y Análisis de Rendimiento',
      theme_color: '#0ea5e9',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      // Don't use navigateFallback - let Nuxt handle routing
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      // Only cache static assets, not navigation requests
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-api',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 5, // 5 minutes
            },
          },
        },
      ],
    },
    client: {
      installPrompt: true
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },

  app: {
    head: {
      title: 'SPORTIA',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Plataforma de Gestión Deportiva y Análisis de Rendimiento' },
        { name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#0ea5e9' },
        { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#0c4a6e' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  typescript: {
    strict: true
  },

  compatibilityDate: '2024-12-01'
})
