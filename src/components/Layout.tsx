// src/components/Layout.tsx
import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom'
import type { PropsWithChildren } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../stores/auth'
import { useToast } from './Toast'
import Modal from './Modal'
import UserMenu from './UserMenu'
import Footer from './Footer'
// Logo
import logo from '@/assets/holidaze-logo.png'

type NavToastState =
  | undefined
  | { toast?: { type: 'success' | 'error'; message: string } }

/**
 * App-wide layout:
 * - Sticky header with logo, auth links or user menu
 * - Mobile slide-down auth panel
 * - Global toast handoff via navigation state
 * - Footer
 * - Logout confirmation modal
 *
 * Accessibility niceties:
 * - Skip link to main content
 * - Locks body scroll when mobile menu is open
 * - Focus the first actionable item when the mobile panel opens
 * - ESC closes the mobile panel
 */
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

useEffect(() => {
  const state = location.state as NavToastState
  const t = state?.toast

  if (t?.message) {
    if (t.type === 'success') {
      success(t.message)
    } else {
      error(t.message)
    }

    // Clear state so the toast doesn't repeat on back/forward.
    navigate(location.pathname + location.search, { replace: true })
  }
}, [location, navigate, success, error])

  // Confirmed logout handler.
  function handleLogoutConfirm() {
    logout()
    setOpenLogoutConfirm(false)
    success('Logged out successfully')
    navigate('/')
  }

  // Close mobile menu on route change (e.g., after clicking a link inside it).
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu is open.
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  // ESC to close mobile panel.
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  // When the mobile panel opens, focus the first focusable element.
  useEffect(() => {
    if (!mobileOpen || !panelRef.current) return
    const firstFocusable = panelRef.current.querySelector<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus()
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen flex-col">
      {/* Skip to content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-black"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-header"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
          style={{
            paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
            paddingRight: 'max(env(safe-area-inset-right), 1rem)',
          }}
        >
          <div className="flex items-center justify-between py-3">
            {/* Left: Logo */}
            <Link to="/" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <img src={logo} alt="Holidaze logo" className="h-12 w-auto md:h-16" />
            </Link>

            {/* Right: nav / user menu */}
            <nav className="flex items-center gap-4 text-sm">
              {!user ? (
                !onAuthPage && (
                  <>
                    {/* Mobile hamburger */}
                    <button
                      type="button"
                      aria-label="Open menu"
                      aria-expanded={mobileOpen}
                      aria-controls="mobile-auth-menu"
                      onClick={() => setMobileOpen((o) => !o)}
                      className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-nav shadow-sm transition hover:bg-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:hidden"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                        <rect x="3" y="6" width="18" height="2" rx="1" />
                        <rect x="3" y="11" width="18" height="2" rx="1" />
                        <rect x="3" y="16" width="18" height="2" rx="1" />
                      </svg>
                    </button>

                    {/* Desktop links */}
                    <NavLink
                      to="/register?role=manager"
                      className="hidden md:inline text-nav underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Become a host
                    </NavLink>
                    <NavLink
                      to="/register?role=guest"
                      className="hidden md:inline text-nav underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Register as guest
                    </NavLink>
                    <NavLink
                      to="/login"
                      className="btn hidden md:inline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    >
                      Login
                    </NavLink>
                  </>
                )
              ) : (
                <>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `${isActive ? 'font-semibold' : ''} hidden md:inline text-nav underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70`
                    }
                  >
                    Home
                  </NavLink>

                  {/* Username as non-interactive label */}
                  <span
                    className="hidden max-w-[18ch] truncate text-nav font-medium md:inline"
                    aria-label="Logged in user"
                    title={user.name}
                  >
                    {user.name}
                  </span>

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
                aria-label="Authentication menu"
                className="absolute left-0 right-0 top-full overflow-hidden border-y bg-white shadow-card md:hidden"
              >
                <div className="space-y-3 px-4 py-4">
                  <NavLink to="/login" className="btn-solid block w-full py-2 text-center" role="menuitem">
                    Login
                  </NavLink>
                  <NavLink to="/register?role=guest" className="btn block w-full py-2 text-center" role="menuitem">
                    Register as guest
                  </NavLink>
                  <NavLink to="/register?role=manager" className="btn block w-full py-2 text-center" role="menuitem">
                    Become a host
                  </NavLink>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="mx-auto flex-1 max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />

      {/* Logout confirm modal */}
      <Modal open={openLogoutConfirm} onClose={() => setOpenLogoutConfirm(false)} title="Log out?">
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">Are you sure you want to log out?</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpenLogoutConfirm(false)} className="btn">
              Cancel
            </button>
            <button type="button" onClick={handleLogoutConfirm} className="btn-danger">
              Log out
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
