// src/hooks/useVenueBookings.ts
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import type { Booking } from '@/utils/types'
import { useToast } from '@/components/Toast'

export function useVenueBookings(id?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { error: toastError } = useToast() // 👈 henter toast.error

  useEffect(() => {
    if (!id) return
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<{ data: Booking[] }>(
          `/holidaze/venues/${encodeURIComponent(id)}/bookings?_venue=true&_owner=true`
        )
        if (!ignore) setBookings(res.data || [])
      } catch (e: unknown) {
        if (!ignore) {
          const msg =
            e instanceof Error ? e.message : 'Failed to load bookings'
          setError(msg)
          toastError(msg) // 👈 viser toast også
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [id, toastError])

  return { bookings, loading, error }
}
