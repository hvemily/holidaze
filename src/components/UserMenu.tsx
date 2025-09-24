// src/components/UserMenu.tsx
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { Profile } from '@/utils/types'
import { ChevronDown } from 'lucide-react'

export default function UserMenu({
  user,
  onLogoutClick,
}: {
  user: Profile
  onLogoutClick: () => void
}) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement | null>(null)
  const loc = useLocation()

  // Lukk ved rutenavigasjon
  useEffect(() => {
    setOpen(false)
  }, [loc.pathname, loc.search])

  // Lukk ved klikk utenfor
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (btnRef.current && !btnRef.current.contains(t)) {
        const menu = document.getElementById('user-menu-popover')
        if (menu && !menu.contains(t)) setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  // Lukk med ESC
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (open && e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const avatar =
    user.avatar?.url && /^https?:\/\//i.test(user.avatar.url)
      ? user.avatar.url
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          user.name
        )}&backgroundType=gradientLinear`

  return (
    <div className="relative">
      {/* Trigger pill – samme look som før */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-white/50 bg-white/60 px-2 py-1 shadow-sm focus:outline-none focus:ring-2 focus:ring-holi-nav/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="user-menu-popover"
      >
        <img
          src={avatar}
          alt={user.avatar?.alt || `${user.name} avatar`}
          className="h-8 w-8 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
        <ChevronDown
          size={16}
          className={`text-holi-nav transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown – identisk struktur/stil som mobil hamburger-menyen */}
      {open && (
        <div
          id="user-menu-popover"
          role="menu"
          aria-label="User menu"
          className="absolute right-0 top-10 w-56 origin-top-right rounded-2xl border bg-white shadow-card overflow-hidden"
        >
          <div className="p-2 grid gap-2">
            <MenuButton to="/" label="Home" onClick={() => setOpen(false)} solid />
            <MenuButton
              to={`/profile/${encodeURIComponent(user.name)}`}
              label="My profile"
              onClick={() => setOpen(false)}
            />
            <MenuButton to="/venues" label="Venues" onClick={() => setOpen(false)} />

            {/* Logout som rød 'ghost' knapp i samme stil */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onLogoutClick()
              }}
              className="w-full rounded-lg px-3 py-2 text-[13px] border text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Samme look som 'btn' / 'btn-solid' i hamburger-menyen */
function MenuButton({
  to,
  label,
  onClick,
  solid = false,
}: {
  to: string
  label: string
  onClick?: () => void
  solid?: boolean
}) {
  const base =
    'w-full rounded-lg px-3 py-2 text-[13px] text-center border transition'
  const ghost = 'border-gray-200 text-gray-800 hover:bg-gray-50'
  const filled = 'border-transparent bg-black text-white hover:opacity-90 btn-solid' // hvis du har btn-solid
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
