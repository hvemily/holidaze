// src/pages/venues/Venues.tsx
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import type { Venue, Booking } from '@/utils/types'
import Hero from '@/components/Hero'
import VenueCard from '@/components/VenueCard'
import VenueFilters from '@/components/VenueFilters'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
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

/**
 * Venues page
 * - Loads venues (paged), supports text query, date range, guests, and sorting.
 * - If query looks like a direct ID/UUID, tries fetching that venue first.
 * - Optionally fetches bookings per visible venue to check date availability.
 */
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

  // ------- Initial fetch (or direct ID/UUID hit) -------
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

        // Reset/replace pending controller (in case helpers accept a signal)
        abortRef.current?.abort()
        const ac = new AbortController()
        abortRef.current = ac

        const qTrim = debouncedQ.trim()

        // 1) Direct ID/UUID search
        if (qTrim) {
          const direct = await fetchVenueById(qTrim)
          if (direct) {
            if (!mounted) return
            if (inNorway(direct)) {
              setItems(localSort([direct], sort))
              setHasMore(false)
              setIdHit(true)
              return
            } else {
              const msg = 'That venue exists, but it is not in Norway.'
              setItems([])
              setHasMore(false)
              setError(msg)
              toastError(msg)
              return
            }
          }



          // Try extracting UUID from query
          const uuid = extractUuid(qTrim)
          if (uuid) {
            const byUuid = await fetchVenueById(uuid)
            if (!mounted) return
            if (byUuid) {
              if (inNorway(byUuid)) {
                setItems(localSort([byUuid], sort))
                setHasMore(false)
                setIdHit(true)
                return
              } else {
                const msg = 'That venue exists, but it is not in Norway.'
                setItems([])
                setHasMore(false)
                setError(msg)
                toastError(msg)
                return
              }
            } else {
              const msg = 'No venue found with that ID.'
              setItems([])
              setHasMore(false)
              setError(msg)
              toastError(msg)
              return
            }
          }
        }

        // 2) Regular list: first page
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

    return () => {
      mounted = false
      abortRef.current?.abort()
    }
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
      // Keep the "Load more" button from jumping
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      const afterTop = anchor ? anchor.getBoundingClientRect().top : 0
      const delta = afterTop - beforeTop
      if (Math.abs(delta) > 1) {
        window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
      }
    }
  }

  useEffect(() => {
  document.title = "Holidaze | Home"
}, [])


  // ------- Availability fetch when dates are set -------
  useEffect(() => {
    if (!checkIn || !checkOut) return
    const missing = items.map(v => v.id).filter(id => !(id in bookingsByVenue))
    if (missing.length === 0) return

    let cancelled = false
    setLoadingAvail(true)
    ;(async () => {
      try {
        // Chunk to avoid hammering the API
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

  // ------- Availability check (memoized) -------
  const isAvailable = useCallback((v: Venue): boolean => {
    if (!checkIn || !checkOut) return true
    const list = bookingsByVenue[v.id]
    if (!list) return true
    return !list.some(b => rangesOverlap(checkIn, checkOut, b.dateFrom, b.dateTo))
  }, [checkIn, checkOut, bookingsByVenue])

  // ------- Visible cards -------
  const visible = useMemo(() => {
    if (idHit) return items
    const qTrim = debouncedQ.trim()
    return items.filter(v =>
      inNorway(v) &&
      matchesQuery(v, qTrim) &&
      (!guests || (Number(v.maxGuests) || 1) >= guests) &&
      isAvailable(v)
    )
  }, [items, debouncedQ, idHit, guests, isAvailable])

  return (
    <>
      <Hero />

      <section id="venues-list" className="mx-auto grid max-w-7xl gap-6 px-4 py-8">
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

        <div className="flex items-center justify-end gap-2">
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
        {error && (
          <p className="text-red-600" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        {/* SR-only result counter */}
        <p className="sr-only" aria-live="polite">
          {visible.length} venue{visible.length === 1 ? '' : 's'} found
        </p>

        {/* Empty state (only when a query exists) */}
        {!loading && !loadingAvail && !error && debouncedQ && visible.length === 0 && (
          <p className="text-gray-600">No venues found.</p>
        )}

        {/* Skeletons for initial load */}
        {loading && !error && items.length === 0 && (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border bg-white p-4 shadow">
                <Skeleton height={140} />
                <div className="mt-3 space-y-2">
                  <Skeleton height={20} width="70%" />
                  <Skeleton height={15} width="50%" />
                  <Skeleton height={30} width="60%" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List */}
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
                  className="btn"
                  aria-label="Load more venues"
                  disabled={loading}
                  aria-busy={loading}
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

/** Debounce a changing value by `delay` ms. */
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(h)
  }, [value, delay])
  return debounced
}
