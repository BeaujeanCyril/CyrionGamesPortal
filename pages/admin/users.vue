<script setup lang="ts">
const { isAuthenticated, user, isLoading, initKeycloak, login, isSuperAdmin, token } = useAuth()

interface KcUser {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  enabled: boolean
}

interface KcRole {
  id: string
  name: string
  description?: string
}

const users = ref<KcUser[]>([])
const allRoles = ref<KcRole[]>([])
const userRolesMap = ref<Record<string, KcRole[]>>({})
const search = ref('')
const loading = ref(false)
const errorMsg = ref('')

const editingUserId = ref<string | null>(null)
const editingRolesSelection = ref<Set<string>>(new Set())
const isSavingRoles = ref(false)

const showCreate = ref(false)
const createForm = ref({ username: '', firstName: '', lastName: '', email: '', password: '' })
const isCreating = ref(false)

const resetUserId = ref<string | null>(null)
const resetForm = ref({ password: '', temporary: false })
const isResetting = ref(false)

function authHeaders(): HeadersInit {
  return token.value ? { Authorization: `Bearer ${token.value}` } : {}
}

async function loadUsers() {
  if (!token.value) return
  loading.value = true
  errorMsg.value = ''
  try {
    const params = search.value.trim() ? `?search=${encodeURIComponent(search.value.trim())}` : ''
    users.value = await $fetch(`/api/admin/users${params}`, { headers: authHeaders() }) as KcUser[]
    // Charger les rôles de chaque user en parallèle
    const entries = await Promise.all(
      users.value.map(async (u) => {
        try {
          const roles = await $fetch(`/api/admin/users/${u.id}/roles`, { headers: authHeaders() }) as KcRole[]
          return [u.id, roles] as const
        } catch {
          return [u.id, []] as const
        }
      })
    )
    const map: Record<string, KcRole[]> = {}
    for (const [id, roles] of entries) map[id] = roles
    userRolesMap.value = map
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur de chargement'
  } finally {
    loading.value = false
  }
}

async function loadRoles() {
  if (!token.value) return
  try {
    allRoles.value = await $fetch('/api/admin/roles', { headers: authHeaders() }) as KcRole[]
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur rôles'
  }
}

function startEditRoles(u: KcUser) {
  editingUserId.value = u.id
  const current = (userRolesMap.value[u.id] || []).map(r => r.name)
  editingRolesSelection.value = new Set(current)
}

function toggleRoleSelection(name: string) {
  if (editingRolesSelection.value.has(name)) editingRolesSelection.value.delete(name)
  else editingRolesSelection.value.add(name)
  // Forcer la réactivité
  editingRolesSelection.value = new Set(editingRolesSelection.value)
}

async function saveRoles() {
  if (!editingUserId.value) return
  const id = editingUserId.value
  const current = new Set((userRolesMap.value[id] || []).map(r => r.name))
  const target = editingRolesSelection.value
  const toAdd = [...target].filter(n => !current.has(n))
  const toRemove = [...current].filter(n => !target.has(n))

  isSavingRoles.value = true
  try {
    if (toAdd.length) {
      await $fetch(`/api/admin/users/${id}/roles`, {
        method: 'POST',
        headers: authHeaders(),
        body: { roles: toAdd }
      })
    }
    if (toRemove.length) {
      await $fetch(`/api/admin/users/${id}/roles`, {
        method: 'DELETE',
        headers: authHeaders(),
        body: { roles: toRemove }
      })
    }
    editingUserId.value = null
    await loadUsers()
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur sauvegarde rôles'
  } finally {
    isSavingRoles.value = false
  }
}

async function deleteUser(u: KcUser) {
  if (!confirm(`Supprimer définitivement l'utilisateur "${u.username}" ?`)) return
  try {
    await $fetch(`/api/admin/users/${u.id}`, { method: 'DELETE', headers: authHeaders() })
    await loadUsers()
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur suppression'
  }
}

async function createUser() {
  isCreating.value = true
  try {
    await $fetch('/api/admin/users', {
      method: 'POST',
      headers: authHeaders(),
      body: createForm.value
    })
    showCreate.value = false
    createForm.value = { username: '', firstName: '', lastName: '', email: '', password: '' }
    await loadUsers()
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur création'
  } finally {
    isCreating.value = false
  }
}

function openReset(u: KcUser) {
  resetUserId.value = u.id
  resetForm.value = { password: '', temporary: false }
}

async function submitReset() {
  if (!resetUserId.value) return
  if (resetForm.value.password.length < 8) {
    errorMsg.value = 'Mot de passe min 8 caractères'
    return
  }
  isResetting.value = true
  try {
    await $fetch(`/api/admin/users/${resetUserId.value}/reset-password`, {
      method: 'POST',
      headers: authHeaders(),
      body: resetForm.value
    })
    resetUserId.value = null
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Erreur reset password'
  } finally {
    isResetting.value = false
  }
}

const isAuthorized = computed(() => isAuthenticated.value && isSuperAdmin())

onMounted(async () => {
  await initKeycloak()
  if (isAuthorized.value) {
    await loadRoles()
    await loadUsers()
  }
})

watch(isAuthorized, async (v) => {
  if (v) {
    await loadRoles()
    await loadUsers()
  }
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <nav class="bg-black/30 backdrop-blur-sm border-b border-white/10">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="text-white/70 hover:text-white text-sm">← Portail</NuxtLink>
        <span class="text-white text-sm">Administration · Utilisateurs</span>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-4 py-8">
      <div v-if="isLoading" class="text-center text-gray-400 py-12">Chargement...</div>

      <div v-else-if="!isAuthenticated" class="text-center py-12">
        <p class="text-gray-400 mb-4">Connexion requise.</p>
        <button @click="login" class="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-lg border border-purple-500/40">Se connecter</button>
      </div>

      <div v-else-if="!isSuperAdmin()" class="text-center py-12">
        <p class="text-red-400">Accès refusé : superadmin requis.</p>
      </div>

      <template v-else>
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            v-model="search"
            @keyup.enter="loadUsers"
            type="text"
            class="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none"
            placeholder="Rechercher (username, email, prénom...)"
          />
          <button @click="loadUsers" class="px-4 py-2 bg-purple-500/30 text-purple-200 rounded-lg border border-purple-500/40 hover:bg-purple-500/40">
            Rechercher
          </button>
          <button @click="showCreate = true" class="px-4 py-2 bg-green-500/30 text-green-200 rounded-lg border border-green-500/40 hover:bg-green-500/40">
            + Créer un user
          </button>
        </div>

        <div v-if="errorMsg" class="bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg p-3 mb-4">
          {{ errorMsg }}
          <button class="ml-2 underline text-xs" @click="errorMsg = ''">Fermer</button>
        </div>

        <div v-if="loading" class="text-gray-400">Chargement...</div>

        <ul v-else class="space-y-2">
          <li
            v-for="u in users"
            :key="u.id"
            class="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div class="flex items-start justify-between gap-3 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-white">{{ u.username }}</span>
                  <span v-if="!u.enabled" class="text-xs bg-red-500/30 text-red-200 px-2 py-0.5 rounded">désactivé</span>
                </div>
                <div class="text-xs text-gray-400 mt-0.5">
                  {{ [u.firstName, u.lastName].filter(Boolean).join(' ') || '—' }}
                  <span v-if="u.email" class="ml-2">· {{ u.email }}</span>
                </div>
                <div class="mt-2 flex flex-wrap gap-1">
                  <span
                    v-for="r in userRolesMap[u.id] || []"
                    :key="r.id"
                    class="text-xs bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded border border-purple-500/40"
                  >{{ r.name }}</span>
                  <span v-if="!(userRolesMap[u.id] || []).length" class="text-xs text-gray-500 italic">aucun rôle</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-1">
                <button @click="startEditRoles(u)" class="text-xs px-2.5 py-1 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30 hover:bg-purple-500/30">
                  Rôles
                </button>
                <button @click="openReset(u)" class="text-xs px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30">
                  Reset mdp
                </button>
                <button @click="deleteUser(u)" class="text-xs px-2.5 py-1 rounded bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30">
                  Supprimer
                </button>
              </div>
            </div>

            <!-- Edition des rôles inline -->
            <div v-if="editingUserId === u.id" class="mt-4 pt-4 border-t border-white/10">
              <div class="text-sm text-gray-300 mb-2">Sélectionne les rôles à attribuer :</div>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="r in allRoles"
                  :key="r.id"
                  type="button"
                  class="text-xs px-2.5 py-1 rounded border"
                  :class="editingRolesSelection.has(r.name)
                    ? 'bg-purple-500/40 text-white border-purple-500'
                    : 'bg-black/20 text-gray-300 border-white/10 hover:border-white/30'"
                  @click="toggleRoleSelection(r.name)"
                >{{ r.name }}</button>
              </div>
              <div class="flex gap-2 justify-end">
                <button @click="editingUserId = null" class="text-xs px-3 py-1 rounded bg-white/10 text-gray-300">Annuler</button>
                <button
                  @click="saveRoles"
                  :disabled="isSavingRoles"
                  class="text-xs px-3 py-1 rounded bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50"
                >Enregistrer</button>
              </div>
            </div>

            <!-- Reset password inline -->
            <div v-if="resetUserId === u.id" class="mt-4 pt-4 border-t border-white/10">
              <div class="text-sm text-gray-300 mb-2">Nouveau mot de passe :</div>
              <div class="flex flex-col sm:flex-row gap-2">
                <input
                  v-model="resetForm.password"
                  type="text"
                  class="flex-1 px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none text-sm"
                  placeholder="Mot de passe (min 8)"
                />
                <label class="flex items-center gap-2 text-sm text-gray-300">
                  <input v-model="resetForm.temporary" type="checkbox" />
                  Temporaire
                </label>
              </div>
              <div class="flex gap-2 justify-end mt-2">
                <button @click="resetUserId = null" class="text-xs px-3 py-1 rounded bg-white/10 text-gray-300">Annuler</button>
                <button
                  @click="submitReset"
                  :disabled="isResetting"
                  class="text-xs px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-50"
                >Réinitialiser</button>
              </div>
            </div>
          </li>
        </ul>

        <div v-if="!loading && !users.length" class="text-center py-12 text-gray-500">Aucun utilisateur trouvé.</div>
      </template>
    </main>

    <!-- Modal créer user -->
    <div v-if="showCreate" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-30" @click.self="showCreate = false">
      <div class="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold text-white mb-4">Créer un utilisateur</h2>
        <form @submit.prevent="createUser" class="space-y-3">
          <input v-model="createForm.username" type="text" placeholder="Username *" required class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none" />
          <div class="grid grid-cols-2 gap-2">
            <input v-model="createForm.firstName" type="text" placeholder="Prénom" class="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none" />
            <input v-model="createForm.lastName" type="text" placeholder="Nom" class="px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none" />
          </div>
          <input v-model="createForm.email" type="email" placeholder="Email (facultatif)" class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none" />
          <input v-model="createForm.password" type="text" placeholder="Mot de passe *" required class="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white focus:border-purple-500 focus:outline-none" />
          <div class="flex gap-2 justify-end pt-2">
            <button type="button" @click="showCreate = false" class="px-3 py-2 rounded-lg bg-white/10 text-gray-300">Annuler</button>
            <button type="submit" :disabled="isCreating" class="px-3 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50">
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
