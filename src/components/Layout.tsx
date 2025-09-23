// src/components/Layout.tsx
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '../stores/auth'
import { useToast } from './Toast'
import Modal from './Modal'

type NavToastState =
  | undefined
  | {
      toast?: {
        type: 'success' | 'error'
        message: string
      }
    }

export default function Layout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [openLogoutConfirm, setOpenLogoutConfirm] = useState(false)

  useEffect(() => {
    const state = location.state as NavToastState
    const t = state?.toast
    if (t?.message) {
      if (t.type === 'success') success(t.message)
      else error(t.message)

      // Fjern toast-state så den ikke kommer igjen ved back/refresh
      navigate(location.pathname + location.search, { replace: true })
    }
  }, [location, navigate, success, error])

  function handleLogoutConfirm() {
    logout()
    setOpenLogoutConfirm(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl">Holidaze</Link>

          <nav className="flex items-center gap-4 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-700')}
            >
              Home
            </NavLink>

            <NavLink
              to="/venues"
              className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-700')}
            >
              Venues
            </NavLink>

            {user?.venueManager && (
              <NavLink
                to="/manager"
                className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-700')}
              >
                Manage
              </NavLink>
            )}

            {user ? (
              <>
                <NavLink
                  to={`/profile/${user.name}`}
                  className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-700')}
                >
                  {user.name}
                </NavLink>
                {user.venueManager && (
                  <span className="rounded-full border px-2 py-0.5 text-xs">Venue Manager</span>
                )}
                <button
                  onClick={() => setOpenLogoutConfirm(true)}
                  className="rounded-lg border px-3 py-1"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? 'font-semibold' : 'text-gray-700')}
                >
                  Login
                </NavLink>
                <NavLink to="/register" className="rounded-lg border px-3 py-1">
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-sm text-gray-600">
          © {new Date().getFullYear()} Holidaze
        </div>
      </footer>

      {/* Logout confirm modal */}
      <Modal open={openLogoutConfirm} onClose={() => setOpenLogoutConfirm(false)} title="Log out?">
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">Are you sure you want to log out?</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenLogoutConfirm(false)}
              className="rounded border px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogoutConfirm}
              className="rounded bg-red-600 text-white px-4 py-2 text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
