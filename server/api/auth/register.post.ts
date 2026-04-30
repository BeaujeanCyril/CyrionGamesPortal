import { createUser } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const username = String(body?.username || '').trim()
  const password = String(body?.password || '')
  const firstName = body?.firstName ? String(body.firstName).trim() : undefined
  const lastName = body?.lastName ? String(body.lastName).trim() : undefined
  const email = body?.email ? String(body.email).trim() : undefined

  if (!username || username.length < 3) {
    throw createError({ statusCode: 400, message: 'Username requis (min. 3 caractères)' })
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    throw createError({ statusCode: 400, message: 'Username : lettres, chiffres, . _ - uniquement' })
  }
  if (!password || password.length < 8) {
    throw createError({ statusCode: 400, message: 'Mot de passe requis (min. 8 caractères)' })
  }

  await createUser({ username, password, firstName, lastName, email })

  return { success: true }
})
