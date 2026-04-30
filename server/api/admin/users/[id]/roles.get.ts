import { requireSuperAdmin } from '~/server/utils/auth'
import { getUserRealmRoles } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID requis' })
  return await getUserRealmRoles(id)
})
