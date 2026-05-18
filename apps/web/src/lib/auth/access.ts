export type AuthRole = 'ADMIN' | 'STAFF'

export type AuthSession = {
  authenticated: true
  account: {
    id: number
    loginId: string
    displayName: string
    role: AuthRole
  }
  expiresAt: string
}

export function normalizeReturnTo(value: string | null | undefined) {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  return value
}

export function buildLoginPath(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`
}

export function isPathAllowedForRole(pathname: string, role: AuthRole) {
  if (pathname.startsWith('/system/admin')) {
    return role === 'ADMIN'
  }

  if (pathname.startsWith('/staff')) {
    return role === 'ADMIN' || role === 'STAFF'
  }

  return true
}

export function getDefaultPathForRole(role: AuthRole) {
  if (role === 'ADMIN') {
    return '/system/admin/users'
  }

  return '/staff'
}

export function resolveAuthorizedPath(role: AuthRole, requestedPath: string | null) {
  if (requestedPath && isPathAllowedForRole(requestedPath, role)) {
    return requestedPath
  }

  return getDefaultPathForRole(role)
}
