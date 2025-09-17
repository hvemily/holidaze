// src/pages/venues/Venues.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Venue } from '@/utils/types'
import VenueCard from '@/components/VenueCard'
import Hero from '@/components/Hero'
import {
  LIMIT,
  PAGE_FILL_TARGET,
  SORT_OPTIONS,
  type SortValue,
  extractUuid,
  fetchPage,
  fetchVenueById,
  inNorway,
  localSort,
  matchesQuery,
} from '@/utils/venues'

export default function Venues() {
  // Input: ett felt (by/venue/ID)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortValue>('created:desc')

  // Data & status
  const [items, setItems] = useState<Venue[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Søkekontroll
  const [searchTick, setSearchTick] = useState(0)
  const [idHit, setIdHit] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setLoading(true); setError(null); setItems([]); setPage(1); setHasMore(true); setIdHit(false)
        abortRef.current?.abort()
        const ac = new AbortController()
        abortRef.current = ac

        const qTrim = q.trim()

        // --- ID først ---
        if (qTrim) {
          const direct = await fetchVenueById(qTrim)
          if (direct) {
            if (inNorway(direct)) {
              setItems(localSort([direct], sort))
              setHasMore(false)
              setIdHit(true)
              return
            } else {
              setItems([]); setHasMore(false); setError('That venue exists, but it is not in Norway.')
              return
            }
          }
          const uuid = extractUuid(qTrim)
          if (uuid) {
            const byUuid = await fetchVenueById(uuid)
            if (byUuid) {
              if (inNorway(byUuid)) {
                setItems(localSort([byUuid], sort))
                setHasMore(false)
                setIdHit(true)
                return
              } else {
                setItems([]); setHasMore(false); setError('That venue exists, but it is not in Norway.')
                return
              }
            } else {
              setItems([]); setHasMore(false); setError('No venue found with that ID.')
              return
            }
          }
        }

        // --- Ellers: auto-load nyeste først & fyll ~20 synlige Norge-treff ---
        let all: Venue[] = []
        let current = 1
        while (true) {
          const batch = await fetchPage(current, sort)
          if (!mounted) return
          if (batch.length === 0) { setHasMore(false); break }

          all = all.concat(batch)
          const sorted = localSort(all, sort)
          const visibleCount = sorted.filter(v => inNorway(v) && matchesQuery(v, qTrim)).length

          const lastPage = batch.length < LIMIT
          if (visibleCount >= PAGE_FILL_TARGET || lastPage) {
            setItems(sorted)
            setPage(current)
            setHasMore(!lastPage)
            break
          }
          current += 1
        }
      } catch (e: unknown) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : 'Failed to load venues')
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false; abortRef.current?.abort() }
  }, [searchTick, sort])

  // Load more
  const onLoadMore = async () => {
    if (loading || !hasMore) return
    try {
      setLoading(true)
      const nextPage = page + 1
      const next = await fetchPage(nextPage, sort)
      const merged = localSort(items.concat(next), sort)
      setItems(merged)
      setPage(nextPage)
      setHasMore(next.length === LIMIT)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load venues')
    } finally {
      setLoading(false)
    }
  }

  // Synlig liste
  const visible = useMemo(() => {
    if (idHit) return items
    const qTrim = q.trim()
    return items.filter(v => inNorway(v) && matchesQuery(v, qTrim))
  }, [items, q, idHit])

  return (
    <>
      {/* Hero med Norge-bildet */}
      <Hero />

      {/* Innholdet under hero */}
      <section id="venues-list" className="grid gap-6 max-w-6xl mx-auto px-4 py-8">
        {/* Searchbar */}
        <div className="mx-auto w-full max-w-3xl">
          <form
            onSubmit={(e) => { e.preventDefault(); setSearchTick(t => t + 1) }}
            className="flex items-center rounded-full border border-gray-300 shadow-sm bg-white overflow-hidden"
            role="search"
            aria-label="Search venues in Norway"
          >
            <input
              type="text"
              placeholder="Search by city, venue name or ID (Norway)"
              className="flex-1 px-4 py-3 text-sm focus:outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search by city, venue name or ID"
            />
            {q && (
              <button
                type="button"
                onClick={() => { setQ(''); setSearchTick(t => t + 1) }}
                className="px-3 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
                title="Clear"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-3 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 justify-end">
          <label className="text-sm text-gray-600" htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortValue)}
            className="rounded-xl border px-3 py-2"
            aria-label="Sort venues"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {loading && <p>Loading venues…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-gray-600">No venues found.</p>
        )}

        {!loading && !error && visible.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map(v => <VenueCard key={v.id} venue={v} />)}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={onLoadMore}
                  className="rounded-xl border px-4 py-2"
                  aria-label="Load more venues"
                  disabled={loading}
                >
                  {loading ? 'Loading…' : `Load more (${LIMIT})`}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
