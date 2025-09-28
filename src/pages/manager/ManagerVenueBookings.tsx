// src/pages/manager/ManagerVenueBookings.tsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Booking, Venue } from '@/utils/types'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

/**
 * ManagerVenueBookings
 * - fetches a venue by :id and its upcoming bookings.
 * - displays a simple list of upcoming bookings for that venue.
 * - shows toasts on error and handles missing :id gracefully.
 */
export default function ManagerVenueBookings() {
  const { id } = useParams<{ id: string }>()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const { error: toastError } = useToast()

  useEffect(() => {
    let ignore = false

    ;(async () => {
      try {
        setLoading(true)
        setErr(null)

        if (!id) {
          const msg = 'Missing venue id'
          setErr(msg)
          toastError(msg)
          return
        }

        // load venue info
        const v = await api.get<{ data: Venue }>(
          `/holidaze/venues/${encodeURIComponent(id)}`
        )

        // load upcoming bookings (owner/customer data if available)
        const b = await api.get<{ data: Booking[] }>(
          `/holidaze/venues/${encodeURIComponent(id)}/bookings?upcoming=true&_owner=true&_customer=true`
        )

        if (!ignore) {
          setVenue(v.data ?? null)
          setBookings(b.data || [])
        }
      } catch (e: unknown) {
        if (!ignore) {
          const message = e instanceof Error ? e.message : 'Failed to load bookings'
          setErr(message)
          toastError(message)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()

    return () => {
      ignore = true
    }
  }, [id, toastError])

  if (loading) {
    return (
      <section className="grid place-items-center py-16" aria-busy="true" aria-live="polite">
        <Spinner />
      </section>
    )
  }

  if (err) {
    return (
      <p className="text-red-600" role="alert" aria-live="polite">
        {err}
      </p>
    )
  }

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Bookings · {venue?.name ?? '—'}
        </h1>
        <Link to="/manager" className="text-sm underline underline-offset-2">
          Back to Manage
        </Link>
      </div>

      {bookings.length === 0 ? (
        <p className="text-gray-600">No upcoming bookings.</p>
      ) : (
        <div className="grid gap-3">
          {bookings.map((b) => {
            const who =
              // prefer customer name if present; fall back to venue owner; then booking id
              // @ts-expect-error: some API variants include `customer`
              (b.customer?.name as string | undefined) ??
              b.venue?.owner?.name ??
              b.id

            return (
              <article key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="font-medium">
                  {formatDateRange(b.dateFrom, b.dateTo)} · Guests: {b.guests}
                </div>
                <div className="text-sm text-gray-600">By: {who}</div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

/** format a date range like "jan 2, 2025 → jan 5, 2025". */
function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const o: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return `${f.toLocaleDateString(undefined, o)} → ${t.toLocaleDateString(undefined, o)}`
}
