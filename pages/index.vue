<script setup lang="ts">
interface App {
  name: string
  description: string
  url: string
  icon: string
  color: string
  status: 'live' | 'coming'
}

const apps: App[] = [
  {
    name: 'Gloomhaven Companion',
    description: 'Assistant de jeu pour Gloomhaven. Gerez vos campagnes, scenarios et joueurs.',
    url: 'https://gloomhaven.cyriongames.fr',
    icon: '⚔️',
    color: 'from-amber-500 to-orange-600',
    status: 'live'
  },
  {
    name: 'ChildLife',
    description: 'Application familiale pour suivre les progres et recompenses des enfants.',
    url: 'https://childlife.cyriongames.fr',
    icon: '👨‍👩‍👧‍👦',
    color: 'from-green-500 to-emerald-600',
    status: 'live'
  }
]

const goToApp = (url: string) => {
  window.open(url, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <!-- Header -->
    <header class="pt-16 pb-8 text-center">
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
            @click="goToApp(app.url)"
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
      <p>&copy; 2024 Cyrion Games. Tous droits reserves.</p>
    </footer>
  </div>
</template>
