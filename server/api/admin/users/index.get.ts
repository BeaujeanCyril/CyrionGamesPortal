import { requireSuperAdmin } from '~/server/utils/auth'
import { listUsers } from '~/server/utils/keycloakAdmin'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const query = getQuery(event)
  const search = query.search ? String(query.search) : undefined
  return await listUsers(search, 200)
})
