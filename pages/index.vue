<script setup lang="ts">
const { isAuthenticated, user, isLoading, initKeycloak, login, logout, hasAppAccess } = useAuth()

interface App {
  name: string
  description: string
  url: string
  icon: string
  color: string
  status: 'live' | 'coming'
  appId: string
}

const allApps: App[] = [
  {
    name: 'Gloomhaven Companion',
    description: 'Assistant de jeu pour Gloomhaven. Gérez vos campagnes, scénarios et joueurs.',
    url: 'https://gloomhaven.cyriongames.fr',
    icon: '⚔️',
    color: 'from-amber-500 to-orange-600',
    status: 'live',
    appId: 'gloomhaven'
  },
  {
    name: 'Tainted Grail',
    description: 'Gestionnaire de lieux pour Tainted Grail. Suivez vos explorations et menhirs.',
    url: 'https://taintedgrail.cyriongames.fr',
    icon: '🗿',
    color: 'from-stone-500 to-stone-700',
    status: 'live',
    appId: 'taintedgrail'
  },
  {
    name: 'ChildLife',
    description: 'Application familiale pour suivre les progrès et récompenses des enfants.',
    url: 'https://childlife.cyriongames.fr',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-green-500 to-emerald-600',
    status: 'live',
    appId: 'childlife'
  },
  {
    name: 'Shopping',
    description: 'Gestion d\'inventaire et listes de courses par magasin.',
    url: 'https://shopping.cyriongames.fr',
    icon: '🛒',
    color: 'from-blue-500 to-cyan-600',
    status: 'live',
    appId: 'shopping'
  }
]

// Apps visibles selon les rôles de l'utilisateur
const visibleApps = computed(() => {
  if (!isAuthenticated.value) return []
  return allApps.filter(app => hasAppAccess(app.appId))
})

const goToApp = (app: App) => {
  window.location.href = app.url
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
      <!-- Message si non connecté -->
      <div v-if="!isLoading && !isAuthenticated" class="text-center py-12">
        <div class="text-6xl mb-6">🔐</div>
        <h2 class="text-2xl font-bold text-white mb-4">Connexion requise</h2>
        <p class="text-gray-400 mb-6">Connectez-vous pour accéder aux applications</p>
        <button
            @click="login"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-400 hover:to-pink-400 transition-all">
          Se connecter
        </button>
      </div>

      <!-- Message si connecté mais aucun accès -->
      <div v-else-if="!isLoading && isAuthenticated && visibleApps.length === 0" class="text-center py-12">
        <div class="text-6xl mb-6">🚫</div>
        <h2 class="text-2xl font-bold text-white mb-4">Aucun accès</h2>
        <p class="text-gray-400">Vous n'avez accès à aucune application pour le moment.</p>
        <p class="text-gray-500 text-sm mt-2">Contactez un administrateur pour obtenir les droits d'accès.</p>
      </div>

      <!-- Grille des apps accessibles -->
      <div v-else-if="!isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
            v-for="app in visibleApps"
            :key="app.name"
            @click="goToApp(app)"
            class="group relative overflow-hidden rounded-2xl p-6 sm:p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl"
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
            <span class="text-sm font-medium">Accéder</span>
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
