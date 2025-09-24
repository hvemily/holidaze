// src/components/Layout.tsx
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../stores/auth'
import { useToast } from './Toast'
import Modal from './Modal'
import UserMenu from './UserMenu'
import Footer from './Footer'

type NavToastState =
  | undefined
  | { toast?: { type: 'success' | 'error'; message: string } }

export default function Layout({ children }: PropsWithChildren) {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [openLogoutConfirm, setOpenLogoutConfirm] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const onAuthPage =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register')

  // Toast via navigate state
  useEffect(() => {
    const state = location.state as NavToastState
    const t = state?.toast
    if (t?.message) {
      if (t.type === 'success') success(t.message)
      else error(t.message)
      navigate(location.pathname + location.search, { replace: true })
    }
  }, [location, navigate, success, error])

  function handleLogoutConfirm() {
    logout()
    setOpenLogoutConfirm(false)
    success('Logged out successfully')
    navigate('/')
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [mobileOpen])

  // Click outside/ESC to close (for desktop only; on mobile vi bruker backdrop)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-header sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-3 flex items-center justify-between">
            <Link to="/" className="font-extrabold text-xl tracking-wide text-nav">
              HOLIDAZE
            </Link>

            <nav className="flex items-center gap-4 text-sm">
              {!user ? (
                <>
                  {/* Mobile hamburger */}
                  {!onAuthPage && (
                    <button
                      type="button"
                      aria-label="Open menu"
                      aria-expanded={mobileOpen}
                      aria-controls="mobile-auth-menu"
                      onClick={() => setMobileOpen(o => !o)}
                      className="md:hidden rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-nav shadow-sm"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <rect x="3" y="6" width="18" height="2" rx="1" />
                        <rect x="3" y="11" width="18" height="2" rx="1" />
                        <rect x="3" y="16" width="18" height="2" rx="1" />
                      </svg>
                    </button>
                  )}

                  {/* Desktop links */}
                  {!onAuthPage && (
                    <>
                      <NavLink
                        to="/register?role=manager"
                        className="text-nav hover:underline hidden md:inline"
                      >
                        Become a host
                      </NavLink>
                      <NavLink
                        to="/register?role=guest"
                        className="text-nav hover:underline hidden md:inline"
                      >
                        Register as guest
                      </NavLink>
                      <NavLink to="/login" className="btn hidden md:inline">
                        Login
                      </NavLink>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Desktop nav for innlogget */}
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `${isActive ? 'font-semibold' : ''} text-nav hover:underline hidden md:inline`
                    }
                  >
                    Home
                  </NavLink>
                  <NavLink
                    to="/venues"
                    className={({ isActive }) =>
                      `${isActive ? 'font-semibold' : ''} text-nav hover:underline hidden md:inline`
                    }
                  >
                    Venues
                  </NavLink>

                  <UserMenu user={user} onLogoutClick={() => setOpenLogoutConfirm(true)} />
                </>
              )}
            </nav>
          </div>

          {/* Mobile slide-down panel (full width, under header) */}
          {!user && mobileOpen && !onAuthPage && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/30 md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              {/* Panel */}
              <div
                id="mobile-auth-menu"
                ref={panelRef}
                role="menu"
                className="md:hidden absolute left-0 right-0 top-full bg-white border-y shadow-card overflow-hidden"
              >
                <div className="px-4 py-4 space-y-3">
                  <NavLink
                    to="/login"
                    className="btn-solid block w-full text-center py-2"
                    role="menuitem"
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register?role=guest"
                    className="btn block w-full text-center py-2"
                    role="menuitem"
                  >
                    Register as guest
                  </NavLink>
                  <NavLink
                    to="/register?role=manager"
                    className="btn block w-full text-center py-2"
                    role="menuitem"
                  >
                    Become a host
                  </NavLink>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {children}
      </main>

      <Footer />

      {/* Logout confirm modal */}
      <Modal
        open={openLogoutConfirm}
        onClose={() => setOpenLogoutConfirm(false)}
        title="Log out?"
      >
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">Are you sure you want to log out?</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenLogoutConfirm(false)} className="btn">
              Cancel
            </button>
            <button type="button" onClick={handleLogoutConfirm} className="btn-solid">
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
