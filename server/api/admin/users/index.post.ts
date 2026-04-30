import { requireSuperAdmin } from '~/server/utils/auth'
import { createUser } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const body = await readBody(event)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const firstName = body?.firstName ? String(body.firstName).trim() : undefined
  const lastName = body?.lastName ? String(body.lastName).trim() : undefined
  const email = body?.email ? String(body.email).trim() : undefined

  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'username et password requis' })
  }

  return await createUser({ username, password, firstName, lastName, email })
})
