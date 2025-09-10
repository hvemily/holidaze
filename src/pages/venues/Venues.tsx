// src/pages/venues/Venues.tsx
import { useEffect, useState } from 'react'
import { api } from '../../utils/api'
import type { Venue } from '../../utils/types'
import { Link } from 'react-router-dom'

const SORT_OPTIONS = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc',  label: 'Oldest first' },
  { value: 'price:asc',    label: 'Price • Low → High' },
  { value: 'price:desc',   label: 'Price • High → Low' },
  { value: 'rating:desc',  label: 'Rating' },
]

// 👇 Din venue-ID (for feilsøk og synlighet)
const DEBUG_MY_VENUE_ID = 'd8cfbc47-a5c6-48cc-9328-a5a88368ed27'

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

const toNum = (v: unknown, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb)
const toTs  = (v?: string) => (v ? new Date(v).getTime() : 0)

const MIN_Q = 2
const LIMIT_PER_PAGE = 100
const PAGES_TO_FETCH  = 5

// ✅ Hent innlogget profil via API – ikke stol på localStorage
async function fetchMeName(): Promise<string | null> {
  try {
    // api.ts bør allerede sette Authorization-header hvis du er innlogget
    const res = await api.get<{ data: { name?: string } }>('/auth/profile?_=' + Date.now())
    return res?.data?.name ?? null
  } catch {
    return null
  }
}

// Hent flere sider fra /venues (uten serversort → ingen 500)
async function fetchVenuePages(base: string, pages: number, q?: string) {
  const all: Venue[] = []
  for (let page = 1; page <= pages; page++) {
    const p = new URLSearchParams()
    p.set('limit', String(LIMIT_PER_PAGE))
    p.set('page', String(page))
    if (q && q.trim().length >= MIN_Q) p.set('q', q.trim())
    p.set('_', String(Date.now()))
    const res = await api.get<{ data: Venue[] }>(`${base}?${p.toString()}`)
    const batch = res.data || []
    all.push(...batch)
    if (batch.length < LIMIT_PER_PAGE) break
  }
  return all
}

// Hent dine venues via profil
async function fetchMyVenuesByName(name: string | null): Promise<Venue[]> {
  if (!name) return []
  try {
    const res = await api.get<{ data: Venue[] }>(`/holidaze/profiles/${encodeURIComponent(name)}/venues?_=${Date.now()}`)
    return res.data || []
  } catch {
    return []
  }
}

// Hent spesifikk venue (din)
async function fetchVenueById(id: string): Promise<Venue | null> {
  try {
    const res = await api.get<{ data: Venue }>(`/holidaze/venues/${encodeURIComponent(id)}?_=${Date.now()}`)
    return res.data || null
  } catch {
    return null
  }
}

// Klientsort
function sortVenues(data: Venue[], sort: string): Venue[] {
  const arr = data.slice()
  if (sort === 'created:desc') {
    arr.sort((a, b) => toTs(b.created) - toTs(a.created))
  } else if (sort === 'created:asc') {
    arr.sort((a, b) => toTs(a.created) - toTs(b.created))
  } else if (sort === 'price:asc') {
    arr.sort((a, b) =>
      toNum(a.price, Number.POSITIVE_INFINITY) - toNum(b.price, Number.POSITIVE_INFINITY)
    )
  } else if (sort === 'price:desc') {
    arr.sort((a, b) =>
      toNum(b.price, Number.NEGATIVE_INFINITY) - toNum(a.price, Number.NEGATIVE_INFINITY)
    )
  } else if (sort === 'rating:desc') {
    arr.sort((a, b) => toNum(b.rating, 0) - toNum(a.rating, 0))
  }
  return arr
}

export default function Venues() {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('created:desc')
  const [loading, setLoading] = useState(true)
  const [venues, setVenues] = useState<Venue[]>([])
  const [error, setError] = useState<string | null>(null)

  const qDebounced = useDebounced(q, 300)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true); setError(null)

        const effectiveQ = qDebounced.trim()

        // 1) Finn meg via API (ikke localStorage)
        const meName = await fetchMeName()

        // 2) Hent global + mine + min direkte-ID parallelt
        const [globalList, myList, myDirect] = await Promise.all([
          fetchVenuePages('/holidaze/venues', PAGES_TO_FETCH, effectiveQ),
          fetchMyVenuesByName(meName),
          fetchVenueById(DEBUG_MY_VENUE_ID),
        ])

        // 3) Merge + dedupe
        const map = new Map<string, Venue>()
        for (const v of [...globalList, ...myList]) if (v?.id) map.set(v.id, v)

        // — Hvis vi fikk den direkte og den ikke var i merged, legg den inn
        if (myDirect && !map.has(myDirect.id)) {
          map.set(myDirect.id, myDirect)
        }

        let merged = Array.from(map.values())

        // 4) Sortér etter valgt kriterium
        merged = sortVenues(merged, sort)

        // 5) 🔒 Idiotsikkert: sørg for at din venue er helt øverst i arrayet
        if (myDirect) {
          const idx = merged.findIndex(v => v.id === myDirect.id)
          if (idx > 0) {
            const [item] = merged.splice(idx, 1)
            merged.unshift(item)
          }
        }

        // 6) Sett state – vi tar topp 100
        if (!ignore) setVenues(merged.slice(0, LIMIT_PER_PAGE))

        // Debug-logger (kan kommenteres når du er fornøyd)
        console.log('[Venues] me name:', meName)
        console.log('[Venues] global count:', globalList.length)
        console.log('[Venues] my count:', myList.length)
        console.log('[Venues] merged (post-merge) count:', merged.length)
        console.log('[Venues] myDirect?', Boolean(myDirect))
        const idx = merged.findIndex(v => v.id === DEBUG_MY_VENUE_ID)
        console.log('[Venues] my index after final sort+pin:', idx)
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load venues')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [qDebounced, sort])

  return (
    <section className="grid gap-4">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search venues..."
          className="w-full rounded-xl border px-3 py-2"
          aria-label="Search venues"
        />
        {!!q && (
          <button
            type="button"
            onClick={() => setQ('')}
            className="rounded-xl border px-3 py-2"
            aria-label="Clear search"
            title="Clear"
          >
            ✕
          </button>
        )}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border px-3 py-2"
          aria-label="Sort venues"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {q && q.trim().length > 0 && q.trim().length < MIN_Q && (
        <p className="text-xs text-gray-500">Type at least {MIN_Q} characters to search.</p>
      )}

      {loading && <p>Loading venues…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && venues.length === 0 && (
        <p className="text-gray-600">No venues found. Try another search.</p>
      )}

      {!loading && !error && venues.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map(v => {
            const img = v.media?.[0]?.url ?? 'https://picsum.photos/seed/holidaze/640/480'
            const isMine = v.id === DEBUG_MY_VENUE_ID
            return (
              <article key={v.id} className="rounded-2xl overflow-hidden bg-white shadow border">
                <div className="relative">
                  <img src={img} alt={v.media?.[0]?.alt ?? v.name} className="h-48 w-full object-cover" />
                  {isMine && (
                    <span className="absolute top-2 left-2 rounded-md bg-black/70 text-white text-xs px-2 py-1">
                      Your venue
                    </span>
                  )}
                </div>
                <div className="p-4 grid gap-2">
                  <h3 className="font-semibold line-clamp-1">{v.name}</h3>
                  {/* Debug: vis created for å bekrefte nyeste først */}
                  <p className="text-xs text-gray-400">{new Date(v.created).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 line-clamp-2">{v.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">${v.price} /night</span>
                    <Link className="rounded-lg border px-3 py-1" to={`/venues/${v.id}`}>View</Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
