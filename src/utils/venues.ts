// src/utils/venues.ts
import { api } from '@/utils/api'
import type { Venue } from '@/utils/types'

export type SortValue = 'created:desc' | 'created:asc' | 'price:asc' | 'price:desc' | 'rating:desc'

export const COUNTRY = 'norway'
export const LIMIT = 20
export const PAGE_FILL_TARGET = 20

// --- small utils ---
const toNum = (v: unknown, fb = 0) => (Number.isFinite(Number(v)) ? Number(v) : fb)
const ts = (v?: string) => (v ? new Date(v).getTime() : 0)
const tsCreatedUpdated = (v: Venue) => Math.max(ts(v.created), ts(v.updated))
const norm = (s?: string) => (s || '').trim().toLowerCase()

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
    case 'created:desc': return arr.sort((a, b) => tsCreatedUpdated(b) - tsCreatedUpdated(a))
    case 'created:asc' : return arr.sort((a, b) => tsCreatedUpdated(a) - tsCreatedUpdated(b))
    case 'price:asc'   : return arr.sort((a, b) => toNum(a.price, Infinity) - toNum(b.price, Infinity))
    case 'price:desc'  : return arr.sort((a, b) => toNum(b.price, -Infinity) - toNum(a.price, -Infinity))
    case 'rating:desc' : return arr.sort((a, b) => toNum(b.rating, 0) - toNum(a.rating, 0))
    default            : return arr
  }
}

export async function fetchVenueById(id: string): Promise<Venue | null> {
  try {
    const r = await api.get<{ data: Venue }>(`/holidaze/venues/${encodeURIComponent(id)}`)
    return r?.data ?? null
  } catch {
    return null
  }
}

export async function fetchPage(page: number, sort: SortValue) {
  const [field, order] = sort.split(':') as [string, 'asc' | 'desc']
  const params = new URLSearchParams()
  params.set('limit', String(LIMIT))
  params.set('page', String(page))
  params.set('sort', field)
  params.set('sortOrder', order)
  try {
    const res = await api.get<{ data: Venue[] }>(`/holidaze/venues?${params.toString()}`)
    return res.data || []
  } catch {
    // fallback uten sort
    const p2 = new URLSearchParams()
    p2.set('limit', String(LIMIT))
    p2.set('page', String(page))
    const res = await api.get<{ data: Venue[] }>(`/holidaze/venues?${p2.toString()}`)
    return res.data || []
  }
}

// Finner UUID inne i tekst (slug/URL/clipboard)
export function extractUuid(input: string): string | null {
  const m = input.match(/\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/)
  return m ? m[0].toLowerCase() : null
}

export const SORT_OPTIONS: Array<{ value: SortValue; label: string }> = [
  { value: 'created:desc', label: 'Newest first' },
  { value: 'created:asc',  label: 'Oldest first' },
  { value: 'price:asc',    label: 'Price • Low → High' },
  { value: 'price:desc',   label: 'Price • High • Low' },
  { value: 'rating:desc',  label: 'Rating' },
]
