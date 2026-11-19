import Keycloak from 'keycloak-js'

const keycloakConfig = {
  url: 'https://auth.cyriongames.fr',
  realm: 'cyriongames',
  clientId: 'portal'
}

let keycloakInstance: Keycloak | null = null

/**
 * L'initialisation en cours, ou celle qui a deja eu lieu.
 *
 * keycloak-js refuse categoriquement d'etre initialise deux fois :
 * `init()` leve "A 'Keycloak' instance can only be initialized once." des
 * que `didInitialize` est vrai. Or chaque page appelle `initKeycloak()` au
 * montage, ce qui est la bonne facon de faire pour une page ouverte
 * directement — mais la deuxieme page atteinte par navigation client
 * retombait sur la meme instance, relancait `init()`, recevait l'erreur, et
 * le `catch` concluait a une session absente. L'utilisateur authentifie se
 * voyait repondre "Connexion requise" par la page elle-meme.
 *
 * On memorise donc la promesse plutot que la seule instance : les appels
 * suivants attendent le premier au lieu de le refaire. Une variable de
 * module convient ici, et seulement ici, parce que rien n'y est ecrit cote
 * serveur — `initKeycloak` sort avant.
 */
let initPromise: Promise<void> | null = null

export const useAuth = () => {
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false)
  const user = useState<{ id: string; name: string; email: string } | null>('user', () => null)
  const isLoading = useState<boolean>('authLoading', () => true)
  const token = useState<string | null>('token', () => null)

  const initKeycloak = async () => {
    if (typeof window === 'undefined') {
      isLoading.value = false
      return
    }

    // Deja fait, ou en cours : on attend ce resultat-la.
    if (initPromise) return initPromise

    initPromise = runInit()
    return initPromise
  }

  const runInit = async () => {
    if (!keycloakInstance) {
      keycloakInstance = new Keycloak(keycloakConfig)
    }

    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        checkLoginIframe: false,
        pkceMethod: 'S256'
      })

      isAuthenticated.value = authenticated

      if (authenticated && keycloakInstance.tokenParsed) {
        user.value = {
          id: keycloakInstance.tokenParsed.sub || '',
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
