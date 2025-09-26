// src/pages/manager/ManagerCreateVenue.tsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import VenueForm, { type VenuePayload } from '@/pages/manager/VenueForm'
import { useToast } from '@/components/Toast'

/**
 * Locks the <body> scroll while mounted. Restores on unmount.
 */
function ScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  return null
}

/**
 * Full-screen overlay page for creating a new venue.
 * - Uses a scrollable panel with a sticky header.
 * - Submits to `/holidaze/venues` and navigates to the created venue.
 * - Shows toast on success/error.
 */
export default function ManagerCreateVenue() {
  const navigate = useNavigate()
  const { success: toastSuccess, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)
  const headingRef = useRef<HTMLHeadingElement | null>(null)

  // Move focus to the panel heading for better accessibility on mount
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      const res = await api.post<{ data: { id: string } }>('/holidaze/venues', payload)
      toastSuccess('Venue created 🎉')
      navigate(`/venues/${res.data.id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create venue'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Fullscreen overlay that scrolls itself (body is locked by <ScrollLock/>)
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-busy={saving}>
      <ScrollLock />

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      {/* Panel wrapper (centering + margin) */}
      <div className="relative mx-auto my-8 w-full max-w-3xl">
        {/* Panel */}
        <div className="overflow-hidden rounded-xl bg-white shadow-xl">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 border-b bg-white/90 px-6 py-4 backdrop-blur">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-xl font-semibold outline-none"
            >
              Create venue
            </h1>
          </div>

          {/* Content: panel scrolls */}
          <div className="max-h-[80vh] overflow-y-auto p-6 pr-4">
            <VenueForm onSubmit={handleCreate} submitting={saving} />
          </div>
        </div>
      </div>
    </div>
  )
}
