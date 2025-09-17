// src/pages/venues/VenueDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'
import VenueCalendar from '@/components/VenueCalendar'
import RatingStars from '@/components/RatingStars'

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

  // kalender / booking state
  const [range, setRange] = useState<RangeValue>(null)
  const [guests, setGuests] = useState<number>(1)

  const canReserve = useMemo(
    () => Array.isArray(range) && !!range[0] && !!range[1],
    [range]
  )

  const nights = useMemo(
    () => (Array.isArray(range) ? nightsBetween(range[0], range[1]) : 0),
    [range]
  )

  const nightlyPrice = venue?.price ?? 0
  const total = nights * nightlyPrice
  const maxGuests = Math.max(1, Number(venue?.maxGuests ?? 1))

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
    if (guests > maxGuests) {
      alert(`This venue allows up to ${maxGuests} guest${maxGuests === 1 ? '' : 's'}.`)
      return
    }
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

  const gallery = venue?.media?.length
    ? venue.media
    : venue
      ? [{ url: 'https://picsum.photos/seed/venue/800/500', alt: venue.name }]
      : []

  const amenities = venue?.meta ?? {}

  return (
    <section className="grid gap-6">
      {loading && <p>Loading venue…</p>}
      {!loading && (error || !venue) && (
        <p className="text-red-600">{error ?? 'Venue not found.'}</p>
      )}

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

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <RatingStars value={Number(venue.rating) || 0} size="md" showNumber />
            </div>

            <div className="text-sm text-gray-600">
              {venue.location?.city ? `${venue.location.city}, ` : ''}
              {venue.location?.country ?? ''}
            </div>

            {/* Amenities */}
            <div className="mt-1 text-sm text-gray-700">
              <h3 className="font-semibold mb-1">Features & Amenities</h3>
              <ul className="grid gap-1">
                {amenities?.wifi && <li>✅ Wifi</li>}
                {amenities?.breakfast && <li>✅ Breakfast included</li>}
                {amenities?.parking && <li>✅ Parking</li>}
                {amenities?.pets && <li>✅ Pets</li>}
                {!amenities?.wifi && !amenities?.breakfast && !amenities?.parking && !amenities?.pets && (
                  <li className="text-gray-500">No amenities listed.</li>
                )}
              </ul>
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
              <label className="text-sm flex items-center gap-2">
                Guests:
                <input
                  type="number"
                  min={1}
                  max={maxGuests}
                  value={guests}
                  onChange={(e) => {
                    const v = Math.max(1, Math.min(maxGuests, Number(e.target.value) || 1))
                    setGuests(v)
                  }}
                  className="ml-1 w-24 rounded border px-2 py-1"
                />
              </label>
              <span className="text-xs text-gray-500">Max {maxGuests} guest{maxGuests === 1 ? '' : 's'}</span>

              <button
                className="rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
                onClick={handleReserve}
                disabled={!canReserve}
                title={!canReserve ? 'Select a date range' : 'Reserve'}
              >
                Book now
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
