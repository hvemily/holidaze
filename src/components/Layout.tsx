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

  // Click outside / ESC to close
  const menuRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!mobileOpen) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMobileOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link to="/" className="font-extrabold text-xl tracking-wide text-nav">
            HOLIDAZE
          </Link>

          <nav className="relative flex items-center gap-4 text-sm">
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
                    className="md:hidden rounded-xl border border-white/50 bg-white/50 px-3 py-1 text-nav"
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

                {/* Mobile dropdown */}
                {mobileOpen && !onAuthPage && (
                  <div
                    id="mobile-auth-menu"
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 top-10 w-56 origin-top-right rounded-2xl border bg-white shadow-card overflow-hidden md:hidden"
                  >
                    <div className="p-2 grid gap-2">
                      <NavLink
                        to="/login"
                        className="btn-solid w-full text-center"
                        role="menuitem"
                      >
                        Login
                      </NavLink>
                      <NavLink
                        to="/register?role=guest"
                        className="btn w-full text-center"
                        role="menuitem"
                      >
                        Register as guest
                      </NavLink>
                      <NavLink
                        to="/register?role=manager"
                        className="btn w-full text-center"
                        role="menuitem"
                      >
                        Become a host
                      </NavLink>
                    </div>
                  </div>
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
      </header>

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
