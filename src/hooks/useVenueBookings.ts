// src/hooks/useVenueBookings.ts
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import type { Booking } from '@/utils/types'

export function useVenueBookings(id?: string) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let ignore = false
    ;(async () => {
      try {
        setLoading(true); setError(null)
        // Du kan eventuelt begrense med dateFrom/dateTo i query
        const res = await api.get<{ data: Booking[] }>(
          `/holidaze/venues/${encodeURIComponent(id)}/bookings?_venue=true&_owner=true`
        )
        if (!ignore) setBookings(res.data || [])
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Failed to load bookings')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [id])

  return { bookings, loading, error }
}
