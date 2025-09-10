import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue } from '../../utils/types'
import VenueForm, { type VenuePayload } from '../manager/VenueForm'

export default function ManagerEditVenue() {
  const { id } = useParams()
  const nav = useNavigate()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await api.get<{ data: Venue }>(`/holidaze/venues/${id}`)
        if (!ignore) setVenue(res.data)
      } catch (e: any) {
        if (!ignore) setErr(e.message || 'Failed to load venue')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [id])

  async function handleSave(payload: VenuePayload) {
    if (!id) return
    setSaving(true)
    try {
      await api.put(`/holidaze/venues/${id}`, payload)
      nav(`/venues/${id}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading…</p>
  if (err) return <p className="text-red-600">{err}</p>
  if (!venue) return <p>Venue not found.</p>

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Edit venue</h1>
      <VenueForm initial={venue} onSubmit={handleSave} submitting={saving} />
    </section>
  )
}
