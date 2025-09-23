// src/hooks/useProfileData.ts
import { useEffect, useState } from 'react'
import { api } from '@/utils/api'
import type { Booking, Venue, Profile as TProfile } from '@/utils/types'
import { useToast } from '@/components/Toast'

type ProfileResponse = { data: TProfile }
type BookingsResponse = { data: Booking[] }
type VenuesResponse = { data: Venue[] }

export function useProfileData(name?: string) {
  const [profile, setProfile] = useState<TProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { error: toastError } = useToast() // 👈 henter error-toast

  useEffect(() => {
    let ignore = false
    ;(async () => {
      if (!name) {
        const msg = 'Missing profile name'
        setError(msg)
        toastError(msg) // 👈 vis toast også
        setLoading(false)
        return
      }
      try {
        setLoading(true); setError(null)

        const p = await api.get<ProfileResponse>(
          `/holidaze/profiles/${encodeURIComponent(name)}`
        )
        if (ignore) return
        setProfile(p.data)

        const b = await api.get<BookingsResponse>(
          `/holidaze/profiles/${encodeURIComponent(
            name
          )}/bookings?upcoming=true&_owner=true&_venue=true&sort=dateFrom`
        )
        if (ignore) return
        setBookings(b.data || [])

        if (p.data?.venueManager) {
          const v = await api.get<VenuesResponse>(
            `/holidaze/profiles/${encodeURIComponent(name)}/venues?sort=created&limit=50`
          )
          if (ignore) return
          setVenues(v.data || [])
        } else {
          setVenues([])
        }
      } catch (err: unknown) {
        if (!ignore) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load profile'
          setError(msg)
          toastError(msg) // 👈 toast feilmeldingen
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [name, toastError])

  return { profile, bookings, venues, setVenues, loading, error, setProfile }
}
