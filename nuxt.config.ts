export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    keycloakUrl: process.env.KEYCLOAK_URL || 'https://auth.cyriongames.fr',
    keycloakRealm: process.env.KEYCLOAK_REALM || 'cyriongames',
    keycloakAdminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'portal-server',
    keycloakAdminClientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
    public: {
      keycloakUrl: process.env.KEYCLOAK_URL || 'https://auth.cyriongames.fr',
      keycloakRealm: process.env.KEYCLOAK_REALM || 'cyriongames',
      keycloakClientId: process.env.KEYCLOAK_CLIENT_ID || 'portal'
    }
  },
  nitro: {
    compressPublicAssets: true,
    serveStatic: 'inline',
    security: {
      headers: false
    }
  },
  app: {
    head: {
      title: 'Cyrion Games',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Portail des applications Cyrion Games' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  }
})
