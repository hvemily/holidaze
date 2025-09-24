import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'
import VenueCalendar from '@/components/VenueCalendar'
import RatingStars from '@/components/RatingStars'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import { useAuth } from '@/stores/auth'

type RouteParams = { id: string }
type RangeValue = Date | [Date, Date] | null
type BookingEx = Booking & { customer?: { name?: string } }

function nightsBetween(a?: Date, b?: Date) {
  if (!a || !b) return 0
  const d1 = new Date(a); d1.setHours(0,0,0,0)
  const d2 = new Date(b); d2.setHours(0,0,0,0)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
}

export default function VenueDetail() {
  const { id } = useParams<RouteParams>()
  const { user } = useAuth()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  const { error: toastError, success: toastSuccess } = useToast()

  const [activeIdx, setActiveIdx] = useState(0)
  const [range, setRange] = useState<RangeValue>(null)
  const [guests, setGuests] = useState<number>(1)

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
        // Hvis API støtter det, kan du legge til &_customer=true
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

  const isOwner = !!(user?.name && venue?.owner?.name && user.name === venue.owner.name)
  const today0 = new Date(); today0.setHours(0,0,0,0)
  const upcomingBookings = ((venue?.bookings as BookingEx[]) ?? [])
    .filter(b => new Date(b.dateTo) >= today0)
    .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())

  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  const startStr = Array.isArray(range) && range[0] ? range[0].toLocaleDateString(undefined, fmt) : ''
  const endStr   = Array.isArray(range) && range[1] ? range[1].toLocaleDateString(undefined, fmt) : ''

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          {/* Hero */}
          {mainImg && (
            <div className="relative rounded-2xl overflow-hidden shadow border">
              <img
                src={mainImg.url}
                alt={mainImg.alt ?? venue.name}
                className="w-full max-h-[520px] object-cover"
              />

              <div className="absolute right-4 top-4 rounded-full bg-white/85 backdrop-blur px-3 py-1">
                <RatingStars value={Number(venue.rating) || 0} size="md" showNumber />
              </div>
            </div>
          )}

          {/* Thumbs */}
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {gallery.slice(0, 6).map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`rounded-xl border overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 ${i === activeIdx ? 'ring-2 ring-blue-500' : ''}`}
                  aria-label={`Show image ${i + 1}`}
                >
                  <img
                    src={m.url}
                    alt={m.alt ?? venue.name}
                    className="h-28 w-44 object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {/* 2-kol layout */}
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr,380px]">
            {/* Venstre kolonne */}
            <div className="grid gap-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
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

              {/* Amenities */}
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
                ${venue.price ?? 0} <span className="font-normal text-gray-600">/night</span>
              </div>
            </div>

            {/* Høyre kolonne – booking-kort */}
            <aside className="md:sticky md:top-20 self-start">
              <div className="rounded-2xl border bg-white shadow p-4">
                <h2 className="text-lg font-semibold mb-3">Availability</h2>

                <VenueCalendar
                  bookings={(venue.bookings as BookingEx[]) ?? []}
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

                {/* Prisoppsummering */}
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

          {/* Owner-only: Upcoming bookings for this venue */}
          {isOwner && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold mb-3">Upcoming bookings (owner view)</h2>
              {upcomingBookings.length === 0 ? (
                <p className="text-gray-600 text-sm">No upcoming bookings yet.</p>
              ) : (
                <ul className="divide-y divide-gray-200 rounded-xl border bg-white">
                  {upcomingBookings.map(b => {
                    const d1 = new Date(b.dateFrom)
                    const d2 = new Date(b.dateTo)
                    return (
                      <li key={b.id} className="p-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {d1.toLocaleDateString(undefined, fmt)} → {d2.toLocaleDateString(undefined, fmt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {b.guests} guest{(b.guests||1) === 1 ? '' : 's'}
                            {(b as BookingEx).customer?.name ? <> · {(b as BookingEx).customer!.name}</> : null}
                          </p>
                        </div>
                        <span className="shrink-0 text-xs rounded-full border px-2 py-1 bg-gray-50">
                          {nightsBetween(d1, d2)} night{nightsBetween(d1, d2) === 1 ? '' : 's'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )}

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
                <button
                  type="button"
                  className="btn"
                  onClick={() => setConfirmOpen(false)}
                  disabled={booking}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-solid"
                  onClick={confirmReserve}
                  disabled={booking}
                  aria-busy={booking}
                >
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
