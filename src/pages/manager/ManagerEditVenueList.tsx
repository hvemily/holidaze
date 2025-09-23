// src/pages/manager/ManagerEditVenue.tsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue } from '@/utils/types'
import VenueForm, { type VenuePayload } from './VenueForm'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

type RouteParams = { id: string }

export default function ManagerEditVenue() {
  const { id } = useParams<RouteParams>()
  const nav = useNavigate()
  const { error: toastError, success: toastSuccess } = useToast()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    if (!id) {
      const msg = 'Missing venue id'
      setErr(msg)
      toastError(msg)
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        setErr(null)
        const res = await api.get<{ data: Venue }>(
          `/holidaze/venues/${encodeURIComponent(id)}`
        )
        if (!ignore) setVenue(res.data ?? null)
      } catch (error: unknown) {
        if (!ignore) {
          const msg =
            error instanceof Error ? error.message : 'Failed to load venue'
          setErr(msg)
          toastError(msg)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [id, toastError])

  async function handleSave(payload: VenuePayload) {
    if (!id) return
    setSaving(true)
    setErr(null)
    try {
      await api.put(`/holidaze/venues/${encodeURIComponent(id)}`, payload)
      toastSuccess('Venue updated')
      nav(`/venues/${encodeURIComponent(id)}`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save venue'
      setErr(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <section className="grid place-items-center py-16">
        <Spinner />
      </section>
    )
  }

  if (err) return <p className="text-red-600">{err}</p>
  if (!venue) return <p>Venue not found.</p>

  return (
    <section className="grid gap-4">
      <h1 className="text-2xl font-bold">Edit venue</h1>
      <VenueForm initial={venue} onSubmit={handleSave} submitting={saving} />
    </section>
  )
}
