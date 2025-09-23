// src/utils/venues.ts
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'

export type SortValue =
  | 'created:desc'
  | 'created:asc'
  | 'price:asc'
  | 'price:desc'
  | 'rating:desc'

export const COUNTRY = 'norway'
export const LIMIT = 20

// --- small utils ---
const toNum = (v: unknown, fb = 0) =>
  Number.isFinite(Number(v)) ? Number(v) : fb
const ts = (v?: string) => (v ? new Date(v).getTime() : 0)
const tsCreatedUpdated = (v: Venue) => Math.max(ts(v.created), ts(v.updated))

// Normaliserer både diakritikk og norske spesialtegn (æ/ø/å)
// slik at "Tønsberg" også matcher "Tonsberg", osv.
const norm = (s?: string) => {
  if (!s) return ''
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')                 // splitte diakritikk
    .replace(/[\u0300-\u036f]/g, '')  // fjerne diakritiske merker
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .replace(/å/g, 'a')
}

// --- exports ---
export const inNorway = (v: Venue) => norm(v.location?.country) === COUNTRY

export function matchesQuery(v: Venue, qStr: string) {
  if (!qStr) return true
  const n = norm(qStr)
  return (
    norm(v.name).includes(n) ||
    norm(v.description).includes(n) ||
    norm(v.location?.city).includes(n) ||
    norm(v.location?.address).includes(n)
  )
}

export function localSort(data: Venue[], sort: SortValue) {
  const arr = data.slice()
  switch (sort) {
    case 'created:desc':
      return arr.sort((a, b) => tsCreatedUpdated(b) - tsCreatedUpdated(a))
    case 'created:asc':
      return arr.sort((a, b) => tsCreatedUpdated(a) - tsCreatedUpdated(b))
    case 'price:asc':
      return arr.sort(
        (a, b) => toNum(a.price, Infinity) - toNum(b.price, Infinity),
      )
    case 'price:desc':
      return arr.sort(
        (a, b) => toNum(b.price, -Infinity) - toNum(a.price, -Infinity),
      )
    case 'rating:desc':
      return arr.sort((a, b) => toNum(b.rating, 0) - toNum(a.rating, 0))
    default:
      return arr
  }
}

export async function fetchVenueById(id: string): Promise<Venue | null> {
  try {
    const r = await api.get<{ data: Venue }>(
      `/holidaze/venues/${encodeURIComponent(id)}`,
    )
    return r?.data ?? null
  } catch {
    return null
  }
}

/**
 * Henter en side venues fra API.
 * Viktig: vi sender IKKE `q` til API – søket gjøres lokalt via matchesQuery().
 */
export async function fetchPage(page: number, sort: SortValue) {
  const [field, order] = sort.split(':') as [string, 'asc' | 'desc']
  const params = new URLSearchParams()
  params.set('limit', String(LIMIT))
  params.set('page', String(page))
  params.set('sort', field)
  params.set('sortOrder', order)

  try {
    const res = await api.get<{ data: Venue[] }>(
      `/holidaze/venues?${params.toString()}`,
    )
    return res.data || []
  } catch {
    // fallback uten sort
    const p2 = new URLSearchParams()
    p2.set('limit', String(LIMIT))
    p2.set('page', String(page))
    const res = await api.get<{ data: Venue[] }>(
      `/holidaze/venues?${p2.toString()}`,
    )
    return res.data || []
  }
}

// Finner UUID inne i tekst (slug/URL/clipboard)
export function extractUuid(input: string): string | null {
  const m = input.match(
    /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/,
  )
  return m ? m[0].toLowerCase() : null
}

export const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc', label: 'Oldest first' },
  { value: 'price:asc', label: 'Price • Low → High' },
  { value: 'price:desc', label: 'Price • High • Low' },
  { value: 'rating:desc', label: 'Rating' },
]

/* ---------------- Availability helpers ---------------- */

export async function fetchBookingsForVenue(venueId: string): Promise<Booking[]> {
  try {
    // Primært: hent bookinger for dette venue-id'et
    const res = await api.get<{ data: Booking[] }>(
      `/holidaze/bookings?venueId=${encodeURIComponent(venueId)}&limit=200`
    )
    return res.data || []
  } catch {
    // Fallback: noen Noroff-instansar støtter _bookings=true på venue-detalj
    try {
      const res = await api.get<{ data: { bookings?: Booking[] } }>(
        `/holidaze/venues/${encodeURIComponent(venueId)}?_bookings=true`
      )
      return res?.data?.bookings || []
    } catch {
      return []
    }
  }
}

/**
 * Sjekk om to halvåpne intervaller [from, to) overlapper.
 * Tolkning: check-out-dagen er ledig (to er eksklusiv).
 */
export function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  const A1 = new Date(aFrom).getTime()
  const A2 = new Date(aTo).getTime()
  const B1 = new Date(bFrom).getTime()
  const B2 = new Date(bTo).getTime()
  return A1 < B2 && A2 > B1
}
