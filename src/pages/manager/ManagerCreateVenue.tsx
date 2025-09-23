// src/pages/manager/ManagerCreateVenue.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import VenueForm, { type VenuePayload } from '@/pages/manager/VenueForm'
import { useToast } from '@/components/Toast'

function ScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  return null
}

export default function ManagerCreateVenue() {
  const nav = useNavigate()
  const { success, error: toastError } = useToast()
  const [saving, setSaving] = useState(false)

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      const res = await api.post<{ data: { id: string } }>('/holidaze/venues', payload)
      success('Venue created 🎉')
      nav(`/venues/${res.data.id}`)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create venue'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    // FULLSKJERMS OVERLAY SOM SELV SCROLLER
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <ScrollLock />

      {/* backdrop */}
      <div className="fixed inset-0 bg-black/40" />

      {/* panel-wrapper (sentrering + margin) */}
      <div className="relative mx-auto my-8 w-full max-w-3xl">
        {/* panel */}
        <div className="rounded-xl bg-white shadow-xl overflow-hidden">
          {/* sticky header */}
          <div className="sticky top-0 z-10 border-b bg-white/90 px-6 py-4">
            <h1 className="text-xl font-semibold">Create venue</h1>
          </div>

          {/* INNHOLD: SCROLL INNI PANEL */}
          <div className="max-h-[80vh] overflow-y-auto p-6 pr-4">
            <VenueForm onSubmit={handleCreate} submitting={saving} />
          </div>
        </div>
      </div>
    </div>
  )
}
