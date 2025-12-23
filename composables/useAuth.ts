import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'https://auth.cyriongames.fr',
  realm: 'cyriongames',
  clientId: 'portal'
}

let keycloakInstance: Keycloak | null = null

export const useAuth = () => {
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false)
  const user = useState<{ name: string; email: string } | null>('user', () => null)
  const isLoading = useState<boolean>('authLoading', () => true)
  const token = useState<string | null>('token', () => null)

  const initKeycloak = async () => {
    if (typeof window === 'undefined') {
      isLoading.value = false
      return
    }

    if (!keycloakInstance) {
      keycloakInstance = new Keycloak(keycloakConfig)
    }

    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        checkLoginIframe: false
      })

      isAuthenticated.value = authenticated

      if (authenticated && keycloakInstance.tokenParsed) {
        user.value = {
          name: keycloakInstance.tokenParsed.preferred_username || keycloakInstance.tokenParsed.name || 'Utilisateur',
          email: keycloakInstance.tokenParsed.email || ''
        }
        token.value = keycloakInstance.token || null
      }
    } catch (error) {
      console.error('Keycloak init error:', error)
      isAuthenticated.value = false
    } finally {
      isLoading.value = false
    }
  }

  const login = () => {
    if (keycloakInstance) {
      keycloakInstance.login()
    }
  }

  const logout = () => {
    if (keycloakInstance) {
      keycloakInstance.logout({ redirectUri: window.location.origin })
    }
  }

  const hasRole = (role: string): boolean => {
    if (!keycloakInstance || !isAuthenticated.value) return false
    return keycloakInstance.hasRealmRole(role)
  }

  const isSuperAdmin = (): boolean => {
    return hasRole('superadmin')
  }

  const hasAppAccess = (appId: string): boolean => {
    if (!isAuthenticated.value) return false
    // Superadmin a accès à tout
    if (isSuperAdmin()) return true
    // Sinon vérifier le rôle spécifique à l'app
    return hasRole(`${appId}.access`)
  }

  const getAccessibleApps = (appIds: string[]): string[] => {
    if (!isAuthenticated.value) return []
    if (isSuperAdmin()) return appIds
    return appIds.filter(appId => hasRole(`${appId}.access`))
  }

  return {
    isAuthenticated: readonly(isAuthenticated),
    user: readonly(user),
    isLoading: readonly(isLoading),
    token: readonly(token),
    initKeycloak,
    login,
    logout,
    hasRole,
    isSuperAdmin,
    hasAppAccess,
    getAccessibleApps
  }
}
