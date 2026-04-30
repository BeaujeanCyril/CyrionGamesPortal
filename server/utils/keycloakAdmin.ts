// Helpers pour interagir avec l'Admin API de Keycloak via un service account.
// Token client_credentials mis en cache et rafraîchi avant expiration.

interface CachedToken {
  token: string
  expiresAt: number
}

let cached: CachedToken | null = null

function getConfig() {
  const config = useRuntimeConfig()
  const url = config.keycloakUrl
  const realm = config.keycloakRealm
  const clientId = config.keycloakAdminClientId
  const clientSecret = config.keycloakAdminClientSecret
  if (!clientSecret) {
    throw createError({ statusCode: 500, message: 'KEYCLOAK_ADMIN_CLIENT_SECRET non configuré' })
  }
  return { url, realm, clientId, clientSecret }
}

async function fetchAdminToken(): Promise<string> {
  const { url, realm, clientId, clientSecret } = getConfig()
  const tokenUrl = `${url}/realms/${realm}/protocol/openid-connect/token`

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  })

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })

  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: 500, message: `Keycloak token error: ${res.status} ${text}` })
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  cached = {
    token: data.access_token,
    // refresh 30 secondes avant expiration
    expiresAt: Date.now() + (data.expires_in - 30) * 1000
  }
  return data.access_token
}

async function getAdminToken(): Promise<string> {
  if (cached && cached.expiresAt > Date.now()) return cached.token
  return fetchAdminToken()
}

async function adminFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, realm } = getConfig()
  const token = await getAdminToken()

  const res = await fetch(`${url}/admin/realms/${realm}${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: res.status, message: `Keycloak admin error: ${text || res.statusText}` })
  }

  if (res.status === 204) return undefined as T
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) return undefined as T
  return await res.json() as T
}

// === Helpers métier ===

export interface KcUser {
  id: string
  username: string
  email?: string
  firstName?: string
  lastName?: string
  enabled: boolean
  emailVerified?: boolean
  createdTimestamp?: number
}

export interface KcRole {
  id: string
  name: string
  description?: string
  composite?: boolean
  clientRole?: boolean
  containerId?: string
}

export async function listUsers(search?: string, max = 100): Promise<KcUser[]> {
  const params = new URLSearchParams({ max: String(max) })
  if (search) params.set('search', search)
  return await adminFetch(`/users?${params}`)
}

export async function getUser(id: string): Promise<KcUser> {
  return await adminFetch(`/users/${id}`)
}

export async function createUser(input: {
  username: string
  password: string
  firstName?: string
  lastName?: string
  email?: string
}): Promise<{ id: string }> {
  // Keycloak ne renvoie pas le user créé : il met l'ID dans le header Location.
  // On le récupère ensuite par recherche.
  const { url, realm } = getConfig()
  const token = await getAdminToken()

  const res = await fetch(`${url}/admin/realms/${realm}/users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: input.username,
      enabled: true,
      emailVerified: true,
      ...(input.email ? { email: input.email } : {}),
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      credentials: [{
        type: 'password',
        value: input.password,
        temporary: false
      }]
    })
  })

  if (!res.ok) {
    const text = await res.text()
    throw createError({ statusCode: res.status, message: `Création utilisateur impossible: ${text || res.statusText}` })
  }

  // Retrouve l'id depuis le Location ou via recherche
  const location = res.headers.get('Location')
  if (location) {
    const id = location.split('/').pop() || ''
    return { id }
  }

  const found = await listUsers(input.username, 1)
  const match = found.find(u => u.username.toLowerCase() === input.username.toLowerCase())
  if (!match) throw createError({ statusCode: 500, message: 'User créé mais introuvable' })
  return { id: match.id }
}

export async function deleteUser(id: string): Promise<void> {
  await adminFetch(`/users/${id}`, { method: 'DELETE' })
}

export async function resetUserPassword(id: string, password: string, temporary = false): Promise<void> {
  await adminFetch(`/users/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ type: 'password', value: password, temporary })
  })
}

export async function listRealmRoles(): Promise<KcRole[]> {
  return await adminFetch(`/roles`)
}

export async function getUserRealmRoles(id: string): Promise<KcRole[]> {
  return await adminFetch(`/users/${id}/role-mappings/realm`)
}

export async function assignRealmRoles(id: string, roles: KcRole[]): Promise<void> {
  await adminFetch(`/users/${id}/role-mappings/realm`, {
    method: 'POST',
    body: JSON.stringify(roles)
  })
}

export async function removeRealmRoles(id: string, roles: KcRole[]): Promise<void> {
  await adminFetch(`/users/${id}/role-mappings/realm`, {
    method: 'DELETE',
    body: JSON.stringify(roles)
  })
}

// Récupère les KcRole complets à partir de noms
export async function rolesByNames(names: string[]): Promise<KcRole[]> {
  if (!names.length) return []
  const all = await listRealmRoles()
  return all.filter(r => names.includes(r.name))
}
