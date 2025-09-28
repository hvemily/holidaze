// src/components/Protected.tsx
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../stores/auth'

/**
 * protects routes from unauthorized access.
 *
 * - redirects unauthenticated users to `/login`, preserving their intended location in state.
 * - if `requireManager` is true, also restricts access to venue managers only.
 *
 * usage:
 * ```tsx
 * <Protected>
 *   <Profile />
 * </Protected>
 *
 * <Protected requireManager>
 *   <ManagerDashboard />
 * </Protected>
 * ```
 */
export default function Protected({
  children,
  requireManager = false,
}: {
  children: ReactNode
  requireManager?: boolean
}) {
  const { user } = useAuth()
  const location = useLocation()

  // not logged in → go to login, store "from" for redirect after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // logged in but not a manager when required → go home
  if (requireManager && !user.venueManager) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
