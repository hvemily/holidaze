// src/pages/venues/VenueDetail.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
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

/** build a responsive srcSet/sizes for common CDNs (Unsplash/imgix/Cloudinary). */
function buildSrcSet(url: string): { srcSet?: string; sizes?: string } {
  const widths = [768, 1024, 1280, 1600, 2000]

  // Unsplash / generic imgix
  if (url.includes('images.unsplash.com') || url.includes('imgix')) {
    const srcSet = widths
      .map((w) => `${url}${url.includes('?') ? '&' : '?'}auto=format&fit=crop&w=${w}&q=70 ${w}w`)
      .join(', ')
    return {
      srcSet,
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1000px',
    }
  }

  // cloudinary (simple width transform)
  if (url.includes('res.cloudinary.com')) {
    const srcSet = widths
      .map((w) => url.replace('/upload/', `/upload/w_${w},c_fill/`) + ` ${w}w`)
      .join(', ')
    return {
      srcSet,
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1000px',
    }
  }

  // unknown source – return nothing (browser will use `src` only)
  return {}
}

/** inclusive nights between two dates at local midnight. */
function nightsBetween(a?: Date, b?: Date) {
  if (!a || !b) return 0
  const d1 = new Date(a); d1.setHours(0, 0, 0, 0)
  const d2 = new Date(b); d2.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)))
}

/**
 * Venue detail page:
 * - loads a venue (with `_bookings=true`) and shows gallery, info, amenities.
 * - react-Calendar for selecting a date range; calculates nights × price.
 * - handles booking flow with a confirmation modal and error toasts.
 * - uses responsive images + a max width wrapper to avoid over-stretching the hero image.
 */
export default function VenueDetail() {
  const { id } = useParams<RouteParams>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState(false)

  const { error: toastError, success: toastSuccess } = useToast()

  // gallery state
  const [activeIdx, setActiveIdx] = useState(0)
  // tiny-image heuristic: if the natural image width is small, use object-contain to avoid ugly upscaling
  const [tiny, setTiny] = useState(false)

  // calendar / booking state
  const [range, setRange] = useState<RangeValue>(null)
  const [guests, setGuests] = useState<number>(1)

  // confirmation modal
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

  // Load venue
  useEffect(() => {
    if (!id) return
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await api.get<{ data: Venue }>(
          `/holidaze/venues/${encodeURIComponent(id)}?_bookings=true`
        )
        if (!ignore) {
          setVenue(res.data ?? null)
          setActiveIdx(0)
          setTiny(false)
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

  // page title
  useEffect(() => {
    document.title = venue?.name ? `Holidaze | ${venue.name}` : 'Holidaze | Venue'
  }, [venue?.name])

  function handleReserve() {
    // not logged in → send to login with toast
    if (!user) {
      navigate('/login', {
        state: { toast: { type: 'error', message: 'You need to be logged in to book a venue.' } },
        replace: true,
      })
      return
    }
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
      // normalize times slightly (midday start / morning end) to avoid TZ edge cases
      const from = new Date(range[0]); from.setHours(12, 0, 0, 0)
      const to   = new Date(range[1]); to.setHours(10, 0, 0, 0)

      await api.post<{ data: Booking }>('/holidaze/bookings', {
        dateFrom: from.toISOString(),
        dateTo: to.toISOString(),
        guests,
        venueId: id,
      })

      // refresh venue (and bookings) to reflect new state
      const updated = await api.get<{ data: Venue }>(
        `/holidaze/venues/${encodeURIComponent(id)}?_bookings=true&_=${Date.now()}`
      )
      setVenue(updated.data ?? null)
      setRange(null)
      toastSuccess('Booked successfully!')
      setConfirmOpen(false)
    } catch (e: unknown) {
      // handle auth errors explicitly → redirect to login
      if (axios.isAxiosError(e)) {
        const status = e.response?.status
        const msg = String(e.response?.data?.message || '')
        if (status === 401 || /no authorization header/i.test(msg)) {
          setConfirmOpen(false)
          navigate('/login', {
            state: { toast: { type: 'error', message: 'You need to be logged in to book a venue.' } },
            replace: true,
          })
          setBooking(false)
          return
        }
      }
      const msg = e instanceof Error ? e.message : 'Unable to create booking'
      toastError(msg)
    } finally {
      setBooking(false)
    }
  }

  // gallery list (fallback if venue has no media)
  const gallery = useMemo(
    () =>
      venue?.media?.length
        ? venue.media
        : venue
          ? [{ url: 'https://picsum.photos/seed/venue/1200/800', alt: venue.name }]
          : [],
    [venue]
  )
  const mainImg = gallery[activeIdx]

  // UI strings
  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  const startStr = Array.isArray(range) && range[0] ? range[0].toLocaleDateString(undefined, fmt) : ''
  const endStr   = Array.isArray(range) && range[1] ? range[1].toLocaleDateString(undefined, fmt) : ''

  return (
    <section className="overflow-x-clip py-6 sm:py-8">
      {loading && (
        <div className="grid place-items-center py-16" aria-busy="true" aria-live="polite">
          <Spinner />
        </div>
      )}

      {!loading && (error || !venue) && (
        <p className="text-red-600" role="alert" aria-live="polite">
          {error ?? 'Venue not found.'}
        </p>
      )}

      {!loading && venue && (
        <>
          {/* hero – wrapped in a max-width container to avoid over-stretching on ultra-wide screens */}
          {mainImg && (
            <div className="relative mx-auto overflow-hidden rounded-2xl border shadow max-w-5xl">
              <img
                src={mainImg.url}
                {...buildSrcSet(mainImg.url)}
                alt={mainImg.alt ?? venue.name}
                className={`block w-full h-48 sm:h-64 md:h-80 lg:h-[520px] ${tiny ? 'object-contain bg-gray-100' : 'object-cover'}`}
                decoding="async"
                onLoad={(e) => {
                  // if the image itself is small, avoid heavy upscaling artifacts
                  const nW = (e.currentTarget as HTMLImageElement).naturalWidth
                  setTiny(nW < 1200)
                }}
              />
              <div className="absolute right-3 top-3 rounded-full bg-white/85 px-2.5 py-1 backdrop-blur sm:right-4 sm:top-4">
                <RatingStars value={Number(venue.rating) || 0} size="md" showNumber />
              </div>
            </div>
          )}

          {/* thumbnails */}
          {gallery.length > 1 && (
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.slice(0, 6).map((m, i) => {
                const isActive = i === activeIdx
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveIdx(i)}
                    className={`box-border overflow-hidden rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isActive ? 'ring-2 ring-blue-500' : ''
                    }`}
                    aria-label={`Show image ${i + 1}`}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <img
                      src={m.url}
                      alt={m.alt ?? venue.name}
                      className="aspect-[4/3] block w-full max-w-full object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )
              })}
            </div>
          )}

          {/* two columns (stack on mobile) */}
          <div className="mt-6 grid gap-6 sm:mt-8 md:[grid-template-columns:minmax(0,1fr)_360px] lg:[grid-template-columns:minmax(0,1fr)_380px]">
            {/* left column */}
            <div className="grid min-w-0 gap-5">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                  {venue.name}
                </h1>
                <p className="mt-1 text-gray-600">
                  {venue.location?.city ? `${venue.location.city}, ` : ''}
                  {venue.location?.country ?? ''}
                </p>
              </div>

              {venue.description && (
                <p className="leading-relaxed text-gray-700">{venue.description}</p>
              )}

              <div>
                <h3 className="mb-2 font-semibold">Features & Amenities</h3>
                <ul className="grid gap-1 text-gray-700">
                  {venue.meta?.wifi && <li>✅ Wifi</li>}
                  {venue.meta?.breakfast && <li>✅ Breakfast included</li>}
                  {venue.meta?.parking && <li>✅ Parking</li>}
                  {venue.meta?.pets && <li>✅ Pets</li>}
                  {!venue.meta?.wifi &&
                    !venue.meta?.breakfast &&
                    !venue.meta?.parking &&
                    !venue.meta?.pets && (
                      <li className="text-gray-500">No amenities listed.</li>
                    )}
                </ul>
              </div>

              <div className="text-lg font-semibold">
                ${nightlyPrice} <span className="font-normal text-gray-600">/night</span>
              </div>
            </div>

            {/* right column – booking */}
            <aside className="self-start md:sticky md:top-20 min-w-0">
              <div className="rounded-2xl border bg-white p-4 shadow">
                <h2 className="mb-3 text-lg font-semibold">Availability</h2>

                <VenueCalendar
                  bookings={venue.bookings ?? []}
                  value={range}
                  onChange={setRange}
                  minDate={new Date()}
                  className="rounded-lg border"
                />

                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm">
                    <span className="mr-2">Guests:</span>
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  </label>
                  <span className="text-xs text-gray-500">
                    Max {maxGuests} guest{maxGuests === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between">
                    <span>
                      {nights || 0} night{nights === 1 ? '' : 's'} × ${nightlyPrice}
                    </span>
                    <span className="font-medium">${total || 0}</span>
                  </div>
                </div>

                <button
                  className="btn-solid mt-3 w-full"
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

          {/* confirmation modal */}
          <Modal
            open={confirmOpen}
            onClose={() => (booking ? null : setConfirmOpen(false))}
            title="Confirm booking?"
          >
            <div className="grid w-[min(90vw,420px)] gap-3">
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
