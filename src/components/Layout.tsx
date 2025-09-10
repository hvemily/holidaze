// src/components/Layout.tsx
import { NavLink, Link } from 'react-router-dom'
import { PropsWithChildren } from 'react'
import { useAuth } from '../stores/auth'

export default function Layout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white/80 backdrop-blur">
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
                  onClick={logout}
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
    </div>
  )
}
