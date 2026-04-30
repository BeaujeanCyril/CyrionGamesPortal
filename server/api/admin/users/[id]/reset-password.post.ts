import { requireSuperAdmin } from '~/server/utils/auth'
import { resetUserPassword } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'ID requis' })

  const body = await readBody(event)
  const password = String(body?.password || '')
  const temporary = !!body?.temporary

  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, message: 'Mot de passe min 8 caractères' })
  }
  await resetUserPassword(id, password, temporary)
  return { success: true }
})
