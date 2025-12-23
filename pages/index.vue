<script setup lang="ts">
const { isAuthenticated, user, isLoading, initKeycloak, login, logout, hasAppAccess } = useAuth()

interface App {
  name: string
  description: string
  url: string
  icon: string
  color: string
  status: 'live' | 'coming'
  requiresAuth: boolean
  appId: string
}

const apps: App[] = [
  {
    name: 'Gloomhaven Companion',
    description: 'Assistant de jeu pour Gloomhaven. Gérez vos campagnes, scénarios et joueurs.',
    url: 'https://gloomhaven.cyriongames.fr',
    icon: '⚔️',
    color: 'from-amber-500 to-orange-600',
    status: 'live',
    requiresAuth: false,
    appId: 'gloomhaven'
  },
  {
    name: 'ChildLife',
    description: 'Application familiale pour suivre les progrès et récompenses des enfants.',
    url: 'https://childlife.cyriongames.fr',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-green-500 to-emerald-600',
    status: 'live',
    requiresAuth: false,
    appId: 'childlife'
  },
  {
    name: 'Shopping',
    description: 'Liste de courses collaborative avec autocomplétion intelligente.',
    url: 'https://shopping.cyriongames.fr',
    icon: '🛒',
    color: 'from-blue-500 to-cyan-600',
    status: 'live',
    requiresAuth: false,
    appId: 'shopping'
  }
]

const goToApp = (app: App) => {
  if (app.requiresAuth && !isAuthenticated.value) {
    login()
    return
  }
  window.location.href = app.url
}

const canAccessApp = (app: App): boolean => {
  if (!app.requiresAuth) return true
  return isAuthenticated.value && hasAppAccess(app.appId)
}

onMounted(() => {
  initKeycloak()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Auth Topbar -->
    <nav class="bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div class="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
        <div class="text-white/80 text-sm">
          <span v-if="isLoading" class="flex items-center gap-2">
            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Chargement...
          </span>
          <span v-else-if="isAuthenticated && user" class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {{ user.name.charAt(0).toUpperCase() }}
            </span>
            <span>{{ user.name }}</span>
          </span>
          <span v-else class="text-gray-400">Non connecté</span>
        </div>

        <div>
          <button
            v-if="!isLoading && isAuthenticated"
            @click="logout"
            class="px-4 py-2 text-sm rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors border border-red-500/30">
            Déconnexion
          </button>
          <button
            v-else-if="!isLoading"
            @click="login"
            class="px-4 py-2 text-sm rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors border border-purple-500/30">
            Connexion
          </button>
        </div>
      </div>
    </nav>

    <!-- Header -->
    <header class="pt-12 pb-8 text-center">
      <h1 class="text-5xl sm:text-7xl font-bold text-white mb-4 tracking-tight">
        <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
          Cyrion Games
        </span>
      </h1>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto px-4">
        Applications et outils de jeu
      </p>
    </header>

    <!-- Apps Grid -->
    <main class="max-w-5xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
            v-for="app in apps"
            :key="app.name"
            @click="goToApp(app)"
            :disabled="!canAccessApp(app)"
            class="group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            :class="[
              'bg-gradient-to-br',
              app.color,
              'shadow-lg'
            ]">
          <!-- Status badge -->
          <div
              v-if="app.status === 'coming'"
              class="absolute top-4 right-4 bg-black/30 text-white text-xs px-3 py-1 rounded-full">
            Bientot
          </div>

          <!-- Auth required badge -->
          <div
              v-if="app.requiresAuth && !isAuthenticated"
              class="absolute top-4 right-4 bg-black/50 text-amber-300 text-xs px-3 py-1 rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
            Connexion requise
          </div>

          <!-- Icon -->
          <div class="text-5xl sm:text-6xl mb-4 transform group-hover:scale-110 transition-transform">
            {{ app.icon }}
          </div>

          <!-- Content -->
          <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">
            {{ app.name }}
          </h2>
          <p class="text-white/80 text-sm sm:text-base leading-relaxed">
            {{ app.description }}
          </p>

          <!-- Arrow -->
          <div class="mt-6 flex items-center text-white/90 group-hover:text-white transition-colors">
            <span class="text-sm font-medium">Acceder</span>
            <svg class="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>

          <!-- Decorative circles -->
          <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
          <div class="absolute -top-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl" />
        </button>
      </div>
    </main>

    <!-- Footer -->
    <footer class="py-8 text-center text-gray-500 text-sm">
      <p>&copy; 2025 Cyrion Games. Tous droits réservés.</p>
    </footer>
  </div>
</template>
