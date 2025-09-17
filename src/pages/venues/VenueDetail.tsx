// src/pages/venues/VenueDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'
import VenueCalendar from '@/components/VenueCalendar'

type RouteParams = { id: string }
type RangeValue = Date | [Date, Date] | null

function nightsBetween(a?: Date, b?: Date) {
  if (!a || !b) return 0
  const d1 = new Date(a); d1.setHours(0,0,0,0)
  const d2 = new Date(b); d2.setHours(0,0,0,0)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function VenueDetail() {
  const { id } = useParams<RouteParams>()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // kalender / booking state (hooks alltid før ev. return)
  const [range, setRange] = useState<RangeValue>(null)
  const [guests, setGuests] = useState<number>(1)

  // disse hooks må også være før evt. early return
  const canReserve = useMemo(
    () => Array.isArray(range) && !!range[0] && !!range[1],
    [range]
  )

  // kan beregnes selv om venue er null
  const nights = useMemo(
    () => (Array.isArray(range) ? nightsBetween(range[0], range[1]) : 0),
    [range]
  )
  const nightlyPrice = venue?.price ?? 0
  const total = nights * nightlyPrice

  useEffect(() => {
    if (!id) return
    let ignore = false
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const res = await api.get<{ data: Venue }>(
          `/holidaze/venues/${encodeURIComponent(id)}?_bookings=true`
        )
        if (!ignore) setVenue(res.data ?? null)
      } catch (e: unknown) {
        if (!ignore) setError(e instanceof Error ? e.message : 'Failed to load venue')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [id])

  async function handleReserve() {
    if (!id || !Array.isArray(range) || !range[0] || !range[1]) return
    try {
      const from = new Date(range[0]); from.setHours(12, 0, 0, 0)
      const to   = new Date(range[1]); to.setHours(10, 0, 0, 0)

      await api.post<{ data: Booking }>('/holidaze/bookings', {
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        guests,
        venueId: id,
      })

      // refetch for å oppdatere kalender
      const updated = await api.get<{ data: Venue }>(
        `/holidaze/venues/${encodeURIComponent(id)}?_bookings=true&_=${Date.now()}`
      )
      setVenue(updated.data ?? null)
      setRange(null)
      alert('Booking requested!')
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Unable to create booking')
    }
  }

  // UI
  const gallery = venue?.media?.length
    ? venue.media
    : venue
      ? [{ url: 'https://picsum.photos/seed/venue/800/500', alt: venue.name }]
      : []

  return (
    <section className="grid gap-6">
      {/* Loading / error / not found */}
      {loading && <p>Loading venue…</p>}
      {!loading && (error || !venue) && (
        <p className="text-red-600">{error ?? 'Venue not found.'}</p>
      )}

      {/* Resten rendres bare når vi faktisk har venue */}
      {!loading && venue && (
        <>
          {/* Header / bilder */}
          <div className="grid gap-3">
            {gallery[0] && (
              <img
                src={gallery[0].url}
                alt={gallery[0].alt ?? venue.name}
                className="w-full max-h-96 object-cover rounded-xl"
              />
            )}
            {gallery.length > 1 && (
              <div className="grid grid-cols-3 gap-2">
                {gallery.slice(1, 4).map((m, i) => (
                  <img key={i} src={m.url} alt={m.alt ?? venue.name} className="h-24 w-full object-cover rounded-lg" />
                ))}
              </div>
            )}
            <h1 className="text-2xl font-bold">{venue.name}</h1>
            <p className="text-gray-700">{venue.description}</p>
            <div className="text-sm text-gray-600">
              {venue.location?.city ? `${venue.location.city}, ` : ''}
              {venue.location?.country ?? ''}
            </div>
            <div className="font-medium text-lg">${nightlyPrice} /night</div>
          </div>

          {/* Kalender + booking */}
          <div className="grid gap-3">
            <h2 className="text-xl font-semibold">Availability</h2>

            <VenueCalendar
              bookings={venue.bookings ?? []}
              value={range}
              onChange={setRange}
              minDate={new Date()}
            />

            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm">
                Guests:
                <input
                  type="number"
                  min={1}
                  value={guests}
                  onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                  className="ml-2 w-20 rounded border px-2 py-1"
                />
              </label>

              <button
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
                onClick={handleReserve}
                disabled={!canReserve}
                title={!canReserve ? 'Select a date range' : 'Reserve'}
              >
                Reserve
              </button>

              {nights > 0 && (
                <span className="text-sm text-gray-600">
                  {Array.isArray(range) && range[0]?.toLocaleDateString()} →
                  {Array.isArray(range) && range[1]?.toLocaleDateString()} · {nights}{' '}
                  night{nights === 1 ? '' : 's'} · ${total}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
