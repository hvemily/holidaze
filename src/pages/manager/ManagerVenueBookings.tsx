import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../../utils/api'
import type { Booking, Venue } from '../../utils/types'

export default function ManagerVenueBookings() {
  const { id } = useParams<{ id: string }>()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        const v = await api.get<{ data: Venue }>(`/holidaze/venues/${id}`)
        const b = await api.get<{ data: Booking[] }>(
          `/holidaze/venues/${id}/bookings?upcoming=true&_owner=true`
        )
        if (!ignore) {
          setVenue(v.data)
          setBookings(b.data || [])
        }
      } catch (e: unknown) {
        if (!ignore) {
          const message =
            e instanceof Error ? e.message : 'Failed to load bookings'
          setErr(message)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [id])

  if (loading) return <p>Loading…</p>
  if (err) return <p className="text-red-600">{err}</p>

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookings · {venue?.name}</h1>
        <Link to="/manager" className="underline text-sm">
          Back to Manage
        </Link>
      </div>
      {bookings.length === 0 ? (
        <p className="text-gray-600">No upcoming bookings.</p>
      ) : (
        <div className="grid gap-3">
          {bookings.map((b) => (
            <article
              key={b.id}
              className="rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className="font-medium">
                {formatDateRange(b.dateFrom, b.dateTo)} · Guests: {b.guests}
              </div>
              <div className="text-sm text-gray-600">
                By: {b.venue?.owner?.name ?? b.id}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const o: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return `${f.toLocaleDateString(undefined, o)} → ${t.toLocaleDateString(
    undefined,
    o
  )}`
}
