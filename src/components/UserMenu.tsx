// src/components/UserMenu.tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Profile } from '@/utils/types'
import { ChevronDown } from 'lucide-react'

type Props = {
  user: Profile
  onLogoutClick: () => void
}

/**
 * user avatar dropdown menu.
 * - toggles on click.
 * - closes on route change, outside click, and Escape key.
 * - focus management: moves focus into the menu on open and back to the button on close.
 */
export default function UserMenu({ user, onLogoutClick }: Props) {
  const [open, setOpen] = useState(false)
  const loc = useLocation()

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstItemRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null)

  // close on route navigation
  useEffect(() => {
    setOpen(false)
  }, [loc.pathname, loc.search])

  // close on outside click
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpen(false)
        // restore focus to the trigger to avoid focus loss
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open])

  // close on ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
        buttonRef.current?.focus()
      }
      // optional nicety: ArrowDown from the button opens and focuses first item
      if (e.key === 'ArrowDown' && document.activeElement === buttonRef.current) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // move focus into the menu when it opens
  useEffect(() => {
    if (open) {
      // delay to next tick so DOM is present
      setTimeout(() => firstItemRef.current?.focus(), 0)
    }
  }, [open])

  const avatar =
    user.avatar?.url && /^https?:\/\//i.test(user.avatar.url)
      ? user.avatar.url
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user.name
        )}&backgroundType=gradientLinear`

  return (
    <div className="relative" ref={wrapperRef}>
      {/* trigger pill */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-2 py-1 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-holi-nav/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-popover"
      >
      <img
        key={avatar}                 // 🔸 forces remount when URL changes
        src={avatar}
        alt={user.avatar?.alt || `${user.name}'s avatar`}
        className="h-8 w-8 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />

        <ChevronDown
          size={16}
          className={`text-holi-nav transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* dropdown */}
      {open && (
        <div
          id="user-menu-popover"
          ref={menuRef}
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-10 w-56 origin-top-right overflow-hidden rounded-2xl border bg-white shadow-card"
        >
          <div className="grid gap-2 p-2">
            <MenuButton
              to="/"
              label="Home"
              onClick={() => setOpen(false)}
              solid
              // first item grabs focus on open
              ref={firstItemRef as React.RefObject<HTMLAnchorElement>}
            />
            <MenuButton
              to={`/profile/${encodeURIComponent(user.name)}`}
              label="My profile"
              onClick={() => setOpen(false)}
            />
            <MenuButton
              to="/venues"
              label="Venues"
              onClick={() => setOpen(false)}
            />

            {/* logout */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onLogoutClick()
              }}
              className="w-full rounded-lg border border-red-200 px-3 py-2 text-[13px] text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** button with same look as 'btn' / 'btn-solid' in the hamburger menu */
const MenuButton = ({
  to,
  label,
  onClick,
  solid = false,
  // ref is forwarded so the first item can be auto-focused
}: {
  to: string
  label: string
  onClick?: () => void
  solid?: boolean
  ref?: React.Ref<HTMLAnchorElement>
}) => {
  const base = 'w-full rounded-lg px-3 py-2 text-center text-[13px] border transition'
  const ghost = 'border-gray-200 text-gray-800 hover:bg-gray-50'
  const filled = 'border-transparent bg-holi-nav text-white hover:bg-holi-nav/90'

  return (
    <Link
      to={to}
      onClick={onClick}
      role="menuitem"
      className={`${base} ${solid ? filled : ghost}`}
    >
      {label}
    </Link>
  )
}
