import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../stores/auth'

export default function Protected({
  children,
  requireManager = false
}: { children: React.ReactNode; requireManager?: boolean }) {
  const { user } = useAuth()
  const loc = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: loc }} replace />
  if (requireManager && !user.venueManager) return <Navigate to="/" replace />
  return children
}
