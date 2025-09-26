// src/components/Protected.tsx
import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../stores/auth'

/**
 * Protects routes from unauthorized access.
 *
 * - Redirects unauthenticated users to `/login`, preserving their intended location in state.
 * - If `requireManager` is true, also restricts access to venue managers only.
 *
 * Usage:
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

  // Not logged in → go to login, store "from" for redirect after login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but not a manager when required → go home
  if (requireManager && !user.venueManager) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
