<script setup lang="ts">
const form = ref({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirm: ''
})
const isSubmitting = ref(false)
const error = ref('')
const success = ref(false)

async function submit() {
  error.value = ''

  const u = form.value.username.trim()
  if (u.length < 3) { error.value = 'Username : 3 caractères min'; return }
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) { error.value = 'Username : lettres, chiffres, . _ - uniquement'; return }
  if (form.value.password.length < 8) { error.value = 'Mot de passe : 8 caractères min'; return }
  if (form.value.password !== form.value.confirm) { error.value = 'Les mots de passe ne correspondent pas'; return }

  isSubmitting.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        username: u,
        firstName: form.value.firstName.trim() || undefined,
        lastName: form.value.lastName.trim() || undefined,
        email: form.value.email.trim() || undefined,
        password: form.value.password
      }
    })
    success.value = true
  } catch (e: any) {
    error.value = e.data?.message || 'Erreur lors de la création du compte'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
    <nav class="bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div class="max-w-5xl mx-auto px-4 py-3">
        <NuxtLink to="/" class="text-white/70 hover:text-white text-sm">← Retour au portail</NuxtLink>
      </div>
    </nav>

    <main class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h1 class="text-2xl font-bold text-white mb-1">Créer un compte</h1>
        <p class="text-gray-400 text-sm mb-6">Une fois inscrit, demande à un administrateur l'accès aux applications.</p>

        <div v-if="success" class="bg-green-500/20 border border-green-500/40 text-green-200 rounded-lg p-4 mb-4">
          <p class="font-semibold">Compte créé ✅</p>
          <p class="text-sm mt-1">Tu peux maintenant te connecter sur le portail.</p>
          <NuxtLink to="/" class="inline-block mt-3 px-4 py-2 rounded-lg bg-purple-500/30 text-purple-200 hover:bg-purple-500/40 text-sm border border-purple-500/40">
            Aller au portail
          </NuxtLink>
        </div>

        <form v-else @submit.prevent="submit" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-300 mb-1">Identifiant *</label>
            <input
              v-model="form.username"
              type="text"
              autocomplete="username"
              required
              class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              placeholder="ex: jean.dupont"
            />
            <p class="text-xs text-gray-500 mt-1">Lettres, chiffres, . _ - uniquement</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm text-gray-300 mb-1">Prénom</label>
              <input
                v-model="form.firstName"
                type="text"
                autocomplete="given-name"
                class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-300 mb-1">Nom</label>
              <input
                v-model="form.lastName"
                type="text"
                autocomplete="family-name"
                class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-1">Email (facultatif)</label>
            <input
              v-model="form.email"
              type="email"
              autocomplete="email"
              class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-1">Mot de passe *</label>
            <input
              v-model="form.password"
              type="password"
              autocomplete="new-password"
              required
              class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
            />
            <p class="text-xs text-gray-500 mt-1">8 caractères minimum</p>
          </div>

          <div>
            <label class="block text-sm text-gray-300 mb-1">Confirmer le mot de passe *</label>
            <input
              v-model="form.confirm"
              type="password"
              autocomplete="new-password"
              required
              class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div v-if="error" class="bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg p-3 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-400 hover:to-pink-400 transition-all disabled:opacity-50"
          >
            {{ isSubmitting ? 'Création...' : 'Créer mon compte' }}
          </button>
        </form>
      </div>
    </main>
  </div>
</template>
