import { requireSuperAdmin } from '~/server/utils/auth'
import { assignRealmRoles, rolesByNames } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID requis' })

  const body = await readBody(event)
  const names = Array.isArray(body?.roles) ? body.roles.map(String) : []
  if (!names.length) throw createError({ statusCode: 400, message: 'Aucun rôle fourni' })

  const roles = await rolesByNames(names)
  if (roles.length !== names.length) {
    throw createError({ statusCode: 400, message: 'Certains rôles sont inconnus' })
  }
  await assignRealmRoles(id, roles)
  return { success: true }
})
