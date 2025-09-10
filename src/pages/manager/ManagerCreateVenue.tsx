import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import VenueForm, { type VenuePayload } from '../manager/VenueForm'

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
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Create venue</h1>
      <VenueForm onSubmit={handleCreate} submitting={saving} />
    </section>
  )
}
