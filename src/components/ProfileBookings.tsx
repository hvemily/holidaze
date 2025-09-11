// src/pages/profile/ProfileBookings.tsx
import { Link } from 'react-router-dom'
import type { Booking } from '@/utils/types'

export default function ProfileBookings({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return <p className="text-gray-600">No upcoming bookings.</p>
  }

  return (
    <div className="grid gap-3">
      {bookings.map((b) => (
        <article key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">
              {b.venue?.name || 'Venue'} · {formatDateRange(b.dateFrom, b.dateTo)}
            </div>
            <Link to={`/venues/${b.venue?.id || ''}`} className="text-sm underline">
              View
            </Link>
          </div>
          <div className="text-sm text-gray-600">
            Guests: {b.guests}{' '}
            {b.venue?.location?.city ? `· ${b.venue.location.city}` : ''}
          </div>
        </article>
      ))}
    </div>
  )
}

function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return `${f.toLocaleDateString(undefined, opts)} → ${t.toLocaleDateString(undefined, opts)}`
}
