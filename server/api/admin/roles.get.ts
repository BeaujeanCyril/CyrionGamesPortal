import { requireSuperAdmin } from '~/server/utils/auth'
import { listRealmRoles } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const roles = await listRealmRoles()
  // Exclure les rôles techniques Keycloak
  return roles.filter(r => !['default-roles-cyriongames', 'offline_access', 'uma_authorization'].includes(r.name))
})
