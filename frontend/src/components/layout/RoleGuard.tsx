import { UserRole } from '../../types/api.types'
import { useAppSelector } from '../../app/hooks'

interface Props {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  OWNER: 0, MANAGER: 1, SUPERVISOR: 2, CASHIER: 3, WAITER: 4
}

export function RoleGuard({ allowedRoles, children, fallback = null }: Props) {
  const user = useAppSelector(s => s.auth.user)
  if (!user) return <>{fallback}</>
  const hasAccess = allowedRoles.some(role => ROLE_HIERARCHY[user.role] <= ROLE_HIERARCHY[role])
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

export function useHasRole(requiredRole: UserRole): boolean {
  const user = useAppSelector(s => s.auth.user)
  if (!user) return false
  return ROLE_HIERARCHY[user.role] <= ROLE_HIERARCHY[requiredRole]
}
