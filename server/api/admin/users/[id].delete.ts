import { requireSuperAdmin } from '~/server/utils/auth'
import { deleteUser } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  const claims = await requireSuperAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID requis' })

  // Sécurité minimale : empêcher de se supprimer soi-même
  if (claims.sub === id) {
    throw createError({ statusCode: 400, message: 'Impossible de se supprimer soi-même' })
  }

  await deleteUser(id)
  return { success: true }
})
