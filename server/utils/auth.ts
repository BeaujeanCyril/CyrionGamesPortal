// Vérification des JWT Keycloak côté serveur via JWKS.
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { H3Event } from 'h3'

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

function getJwks() {
  if (jwks) return jwks
  const config = useRuntimeConfig()
  const url = new URL(`${config.keycloakUrl}/realms/${config.keycloakRealm}/protocol/openid-connect/certs`)
  jwks = createRemoteJWKSet(url)
  return jwks
}

export interface KeycloakClaims extends JWTPayload {
  sub: string
  preferred_username?: string
  email?: string
  name?: string
  realm_access?: { roles: string[] }
}

export async function verifyToken(token: string): Promise<KeycloakClaims> {
  const config = useRuntimeConfig()
  const { payload } = await jwtVerify(token, getJwks(), {
    issuer: `${config.keycloakUrl}/realms/${config.keycloakRealm}`
  })
  return payload as KeycloakClaims
}

function extractBearer(event: H3Event): string | null {
  const auth = getHeader(event, 'authorization')
  if (!auth) return null
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  return m ? m[1] : null
}

export async function requireUser(event: H3Event): Promise<KeycloakClaims> {
  const token = extractBearer(event)
  if (!token) {
    throw createError({ statusCode: 401, message: 'Authentification requise' })
  }
  try {
    return await verifyToken(token)
  } catch {
    throw createError({ statusCode: 401, message: 'Token invalide' })
  }
}

export async function requireSuperAdmin(event: H3Event): Promise<KeycloakClaims> {
  const claims = await requireUser(event)
  const roles = claims.realm_access?.roles || []
  if (!roles.includes('superadmin')) {
    throw createError({ statusCode: 403, message: 'Accès refusé : superadmin requis' })
  }
  return claims
}
