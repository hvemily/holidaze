// src/pages/manager/ManagerCreateVenue.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import VenueForm, { type VenuePayload } from '../manager/VenueForm'

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
  const [saving, setSaving] = useState(false)

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      const res = await api.post<{ data: { id: string } }>(`/holidaze/venues`, payload)
      nav(`/venues/${res.data.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Hele overlayen scroller
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <ScrollLock />
      {/* backdrop */}
      <div className="fixed inset-0 bg-black/40" />

      {/* panel */}
      <div className="relative mx-auto my-8 w-full max-w-3xl">
        <div className="rounded-xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 border-b bg-white/90 px-6 py-4">
            <h1 className="text-xl font-semibold">Create venue</h1>
          </div>

          {/* Ingen egen overflow her; overlayen tar seg av scroll */}
          <div className="p-6">
            <VenueForm onSubmit={handleCreate} submitting={saving} />
          </div>
        </div>
      </div>
    </div>
  )
}
