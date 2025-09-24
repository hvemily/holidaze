// src/pages/venues/VenueDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'
import VenueCalendar from '@/components/VenueCalendar'
import RatingStars from '@/components/RatingStars'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'

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
  const [booking, setBooking] = useState(false)

  const { error: toastError, success: toastSuccess } = useToast()

  // gallery-state
  const [activeIdx, setActiveIdx] = useState(0)

  // calendar / booking state
  const [range, setRange] = useState<RangeValue>(null)
  const [guests, setGuests] = useState<number>(1)

  // modal
  const [confirmOpen, setConfirmOpen] = useState(false)

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
        if (!ignore) {
          setVenue(res.data ?? null)
          setActiveIdx(0)
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load venue'
        if (!ignore) {
          setError(msg)
          toastError(msg)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [id, toastError])

  function handleReserve() {
    if (!Array.isArray(range) || !range[0] || !range[1]) {
      toastError('Please select a date range.')
      return
    }
    if (guests > maxGuests) {
      toastError(`This venue allows up to ${maxGuests} guest${maxGuests === 1 ? '' : 's'}.`)
      return
    }
    setConfirmOpen(true)
  }

  async function confirmReserve() {
    if (!id || !Array.isArray(range) || !range[0] || !range[1]) return
    try {
      setBooking(true)
      const from = new Date(range[0]); from.setHours(12, 0, 0, 0)
      const to   = new Date(range[1]); to.setHours(10, 0, 0, 0)

      await api.post<{ data: Booking }>('/holidaze/bookings', {
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        guests,
        venueId: id,
      })

      const updated = await api.get<{ data: Venue }>(
        `/holidaze/venues/${encodeURIComponent(id)}?_bookings=true&_=${Date.now()}`
      )
      setVenue(updated.data ?? null)
      setRange(null)
      toastSuccess('Booked successfully!')
      setConfirmOpen(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unable to create booking'
      toastError(msg)
    } finally {
      setBooking(false)
    }
  }

  const gallery = venue?.media?.length
    ? venue.media
    : venue
      ? [{ url: 'https://picsum.photos/seed/venue/1200/800', alt: venue.name }]
      : []

  const mainImg = gallery[activeIdx]

  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  const startStr = Array.isArray(range) && range[0] ? range[0].toLocaleDateString(undefined, fmt) : ''
  const endStr   = Array.isArray(range) && range[1] ? range[1].toLocaleDateString(undefined, fmt) : ''

  return (
    <section className="py-6 sm:py-8">
      {loading && (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      )}

      {!loading && (error || !venue) && (
        <p className="text-red-600">{error ?? 'Venue not found.'}</p>
      )}

      {!loading && venue && (
        <>
          {/* Hero – faste høyder pr breakpoint så ingenting flyter ut på mobil */}
          {mainImg && (
            <div className="relative overflow-hidden rounded-2xl shadow border">
              <img
                src={mainImg.url}
                alt={mainImg.alt ?? venue.name}
                className="w-full h-48 sm:h-64 md:h-80 lg:h-[520px] object-cover"
              />
              <div className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full bg-white/85 backdrop-blur px-2.5 py-1">
                <RatingStars value={Number(venue.rating) || 0} size="md" showNumber />
              </div>
            </div>
          )}

          {/* Thumbnails – grid (ikke hor. scroll) for å unngå overflow */}
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {gallery.slice(0, 6).map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`rounded-xl border overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 ${i === activeIdx ? 'ring-2 ring-blue-500' : ''}`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img
                    src={m.url}
                    alt={m.alt ?? venue.name}
                    className="w-full aspect-[4/3] object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 2-kolonne – stack på mobil */}
          <div className="mt-6 sm:mt-8 grid gap-6 md:grid-cols-[1fr,360px] lg:grid-cols-[1fr,380px]">
            {/* Venstre kolonne */}
            <div className="grid gap-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {venue.name}
                </h1>
                <p className="mt-1 text-gray-600">
                  {venue.location?.city ? `${venue.location.city}, ` : ''}
                  {venue.location?.country ?? ''}
                </p>
              </div>

              {venue.description && (
                <p className="text-gray-700 leading-relaxed">{venue.description}</p>
              )}

              <div>
                <h3 className="font-semibold mb-2">Features & Amenities</h3>
                <ul className="grid gap-1 text-gray-700">
                  {venue.meta?.wifi && <li>✅ Wifi</li>}
                  {venue.meta?.breakfast && <li>✅ Breakfast included</li>}
                  {venue.meta?.parking && <li>✅ Parking</li>}
                  {venue.meta?.pets && <li>✅ Pets</li>}
                  {!venue.meta?.wifi &&
                    !venue.meta?.breakfast &&
                    !venue.meta?.parking &&
                    !venue.meta?.pets && <li className="text-gray-500">No amenities listed.</li>}
                </ul>
              </div>

              <div className="font-semibold text-lg">
                ${nightlyPrice} <span className="font-normal text-gray-600">/night</span>
              </div>
            </div>

            {/* Høyre kolonne – booking */}
            <aside className="md:sticky md:top-20 self-start">
              <div className="rounded-2xl border bg-white shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Availability</h2>

                <VenueCalendar
                  bookings={venue.bookings ?? []}
                  value={range}
                  onChange={setRange}
                  minDate={new Date()}
                  className="rounded-lg border"
                />

                <div className="mt-3 flex items-center gap-2">
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
                  <span className="text-xs text-gray-500">
                    Max {maxGuests} guest{maxGuests === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-3 rounded-lg bg-gray-50 border p-3 text-sm">
                  <div className="flex justify-between">
                    <span>{nights || 0} night{nights === 1 ? '' : 's'} × ${nightlyPrice}</span>
                    <span className="font-medium">${total || 0}</span>
                  </div>
                </div>

                <button
                  className="mt-3 w-full btn-solid"
                  onClick={handleReserve}
                  disabled={!canReserve || booking}
                  aria-busy={booking}
                  title={!canReserve ? 'Select a date range' : 'Reserve'}
                >
                  {booking ? 'Booking…' : 'Book now'}
                </button>
              </div>
            </aside>
          </div>

          {/* Bekreftelses-modal */}
          <Modal
            open={confirmOpen}
            onClose={() => (booking ? null : setConfirmOpen(false))}
            title="Confirm booking?"
          >
            <div className="grid gap-3 w-[min(90vw,420px)]">
              <p className="text-sm text-gray-700">
                Do you want to book <span className="font-medium">{venue.name}</span> from{' '}
                <span className="font-medium">{startStr}</span> to{' '}
                <span className="font-medium">{endStr}</span> for{' '}
                <span className="font-medium">{guests}</span> guest{guests === 1 ? '' : 's'}?
              </p>
              {nights > 0 && (
                <p className="text-sm text-gray-700">
                  {nights} night{nights === 1 ? '' : 's'} × ${nightlyPrice} ={' '}
                  <span className="font-semibold">${total}</span>
                </p>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" className="btn" onClick={() => setConfirmOpen(false)} disabled={booking}>
                  Cancel
                </button>
                <button type="button" className="btn-solid" onClick={confirmReserve} disabled={booking} aria-busy={booking}>
                  {booking ? 'Booking…' : 'Confirm'}
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </section>
  )
}
