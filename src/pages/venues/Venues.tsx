// src/pages/venues/Venues.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Venue, Booking } from '@/utils/types'
import Hero from '@/components/Hero'
import VenueCard from '@/components/VenueCard'
import VenueFilters from '@/components/VenueFilters'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import {
  LIMIT,
  SORT_OPTIONS,
  type SortValue,
  extractUuid,
  fetchPage,
  fetchVenueById,
  inNorway,
  localSort,
  matchesQuery,
  fetchBookingsForVenue,
  rangesOverlap,
} from '@/utils/venues'

export default function Venues() {
  // Filters
  const [q, setQ] = useState('')
  const debouncedQ = useDebouncedValue(q, 400)
  const [checkIn, setCheckIn] = useState<string | undefined>()
  const [checkOut, setCheckOut] = useState<string | undefined>()
  const [guests, setGuests] = useState<number>(1)
  const [sort, setSort] = useState<SortValue>('created:desc')

  // Data & status
  const [items, setItems] = useState<Venue[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [idHit, setIdHit] = useState(false)

  // Availability cache: venueId -> bookings
  const [bookingsByVenue, setBookingsByVenue] = useState<Record<string, Booking[]>>({})
  const [loadingAvail, setLoadingAvail] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { error: toastError } = useToast()

  // ------- Fetch første side (eller ID-treff) -------
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        setItems([])
        setPage(1)
        setHasMore(true)
        setIdHit(false)
        setBookingsByVenue({})

        abortRef.current?.abort()
        const ac = new AbortController()
        abortRef.current = ac

        const qTrim = debouncedQ.trim()

        // Direkte ID/UUID-søk
        if (qTrim) {
          const direct = await fetchVenueById(qTrim)
          if (direct) {
            if (inNorway(direct)) {
              if (!mounted) return
              setItems(localSort([direct], sort))
              setHasMore(false)
              setIdHit(true)
              return
            } else {
              if (!mounted) return
              const msg = 'That venue exists, but it is not in Norway.'
              setItems([])
              setHasMore(false)
              setError(msg)
              toastError(msg)
              return
            }
          }
          const uuid = extractUuid(qTrim)
          if (uuid) {
            const byUuid = await fetchVenueById(uuid)
            if (byUuid) {
              if (inNorway(byUuid)) {
                if (!mounted) return
                setItems(localSort([byUuid], sort))
                setHasMore(false)
                setIdHit(true)
                return
              } else {
                if (!mounted) return
                const msg = 'That venue exists, but it is not in Norway.'
                setItems([])
                setHasMore(false)
                setError(msg)
                toastError(msg)
                return
              }
            } else {
              if (!mounted) return
              const msg = 'No venue found with that ID.'
              setItems([])
              setHasMore(false)
              setError(msg)
              toastError(msg)
              return
            }
          }
        }

        // Vanlig list: kun første side (kjapp)
        const first = await fetchPage(1, sort)
        if (!mounted) return
        setItems(localSort(first, sort))
        setHasMore(first.length === LIMIT)
      } catch (e: unknown) {
        if (!mounted) return
        const msg = e instanceof Error ? e.message : 'Failed to load venues'
        setError(msg)
        toastError(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false; abortRef.current?.abort() }
  }, [debouncedQ, sort, toastError])

  // ------- Load more -------
  const onLoadMore = async () => {
    if (loading || !hasMore) return

    const anchor = loadMoreRef.current
    const beforeTop = anchor ? anchor.getBoundingClientRect().top : 0

    try {
      setLoading(true)
      const nextPage = page + 1
      const next = await fetchPage(nextPage, sort)
      setItems(prev => localSort(prev.concat(next), sort))
      setPage(nextPage)
      setHasMore(next.length === LIMIT)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load venues'
      setError(msg)
      toastError(msg)
    } finally {
      setLoading(false)
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      const afterTop = anchor ? anchor.getBoundingClientRect().top : 0
      const delta = afterTop - beforeTop
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
      }
    }
  }

  // ------- Availability fetch når datoer settes -------
  useEffect(() => {
    if (!checkIn || !checkOut) return
    const missing = items.map(v => v.id).filter(id => !(id in bookingsByVenue))
    if (missing.length === 0) return

    let cancelled = false
    setLoadingAvail(true)
    ;(async () => {
      try {
        const chunkSize = 8
        for (let i = 0; i < missing.length; i += chunkSize) {
          const slice = missing.slice(i, i + chunkSize)
          const results = await Promise.all(
            slice.map(async (id) => {
              const bookings = await fetchBookingsForVenue(id)
              return [id, bookings] as const
            })
          )
          if (cancelled) return
          setBookingsByVenue(prev => {
            const copy = { ...prev }
            for (const [id, bookings] of results) copy[id] = bookings
            return copy
          })
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load availability'
        toastError(msg)
      } finally {
        if (!cancelled) setLoadingAvail(false)
      }
    })()

    return () => { cancelled = true }
  }, [checkIn, checkOut, items, bookingsByVenue, toastError])

  // ------- Tilgjengelighets-sjekk -------
  function isAvailable(v: Venue): boolean {
    if (!checkIn || !checkOut) return true
    const list = bookingsByVenue[v.id]
    if (!list) return true
    return !list.some(b => rangesOverlap(checkIn, checkOut, b.dateFrom, b.dateTo))
  }

  // ------- Synlige kort -------
  const visible = useMemo(() => {
    if (idHit) return items
    const qTrim = debouncedQ.trim()
    return items.filter(v =>
      inNorway(v) &&
      matchesQuery(v, qTrim) &&
      (!guests || (Number(v.maxGuests) || 1) >= guests) &&
      isAvailable(v)
    )
  }, [items, debouncedQ, idHit, guests, checkIn, checkOut, bookingsByVenue])

  return (
    <>
      <Hero />

      <section id="venues-list" className="grid gap-6 max-w-7xl mx-auto px-4 py-8">
        <VenueFilters
          q={q}
          onQChange={setQ}
          checkIn={checkIn}
          onCheckInChange={setCheckIn}
          checkOut={checkOut}
          onCheckOutChange={setCheckOut}
          guests={guests}
          onGuestsChange={setGuests}
          busy={loading}
          onSubmit={() => {
            document.getElementById('venues-list')?.scrollIntoView({ behavior: 'smooth' })
          }}
        />

        <div className="flex items-center gap-2 justify-end">
          <label className="text-sm text-gray-600" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-xl border px-3 py-2"
            aria-label="Sort venues"
            title="Sort venues"
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && <p className="text-red-600">{error}</p>}

        {/* Resultat-teller for a11y */}
        <p className="sr-only" aria-live="polite">
          {visible.length} venue{visible.length === 1 ? '' : 's'} found
        </p>

        {/* Ingen funn */}
        {!loading && !loadingAvail && !error && debouncedQ && visible.length === 0 && (
          <p className="text-gray-600">No venues found.</p>
        )}

        {/* Liste */}
        {visible.length > 0 && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {visible.map(v => <VenueCard key={v.id} venue={v} />)}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="mt-4 flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLoadMore() }}
                  className="rounded-xl border px-4 py-2"
                  aria-label="Load more venues"
                  disabled={loading}
                >
                  {loading ? 'Loading…' : 'Load more'}
                </button>

                {(loading || loadingAvail) && <Spinner />}
                {loadingAvail && (
                  <span className="text-xs text-gray-500" aria-live="polite">
                    Loading availability…
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}

/* debounce hook */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}
