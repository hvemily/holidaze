// src/pages/manager/VenueForm.tsx
import { useState } from 'react'
import type { Venue, Media } from '../../utils/types'

export type VenuePayload = {
  name: string
  description?: string
  price: number            // price per night
  maxGuests: number        // capacity
  media?: Media[]          // gallery
  meta?: { wifi?: boolean; parking?: boolean; breakfast?: boolean; pets?: boolean }
  location?: { city?: string; country?: string }
}

const COUNTRIES = ['Norway', 'Sweden', 'Denmark', 'Finland', 'Iceland', 'United Kingdom', 'Germany', 'Spain', 'Italy', 'France']
const CITIES_NO = ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø', 'Kristiansand', 'Ålesund', 'Bodø']
const CITIES_SE = ['Stockholm', 'Gothenburg', 'Malmö']
const CITY_BY_COUNTRY: Record<string, string[]> = {
  Norway: CITIES_NO,
  Sweden: CITIES_SE,
  Denmark: ['Copenhagen', 'Aarhus', 'Odense'],
  Finland: ['Helsinki', 'Tampere', 'Turku'],
  Iceland: ['Reykjavík', 'Akureyri'],
  'United Kingdom': ['London', 'Edinburgh', 'Manchester'],
  Germany: ['Berlin', 'Munich', 'Hamburg'],
  Spain: ['Barcelona', 'Madrid', 'Valencia'],
  Italy: ['Rome', 'Milan', 'Florence'],
  France: ['Paris', 'Nice', 'Lyon'],
}

export default function VenueForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial?: Partial<Venue>
  submitting?: boolean
  onSubmit: (data: VenuePayload) => Promise<void> | void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState<number>(initial?.price ?? 100)
  const [maxGuests, setMaxGuests] = useState<number>(initial?.maxGuests ?? 2)

  // gallery
  const [images, setImages] = useState<{ url: string; alt: string }[]>(
    initial?.media?.length
      ? initial.media.map(m => ({ url: m.url, alt: m.alt ?? '' }))
      : [{ url: '', alt: '' }]
  )

  // amenities
  const [wifi, setWifi] = useState(!!initial?.meta?.wifi)
  const [parking, setParking] = useState(!!initial?.meta?.parking)
  const [breakfast, setBreakfast] = useState(!!initial?.meta?.breakfast)
  const [pets, setPets] = useState(!!initial?.meta?.pets)

  // location
  const [country, setCountry] = useState(initial?.location?.country ?? 'Norway')
  const [city, setCity] = useState(initial?.location?.city ?? '')

  function addImage() {
    setImages(prev => [...prev, { url: '', alt: '' }])
  }
  function removeImage(i: number) {
    setImages(prev => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)))
  }
  function updateImage(i: number, key: 'url'|'alt', value: string) {
    setImages(prev => prev.map((img, idx) => idx === i ? { ...img, [key]: value } : img))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const media = images
      .filter(i => i.url.trim().length > 0)
      .map(i => ({ url: i.url.trim(), alt: i.alt?.trim() || name }))

    const payload: VenuePayload = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price: Number(price),
      maxGuests: Number(maxGuests),
      media,
      meta: { wifi, parking, breakfast, pets },
      location: {
        country: country || undefined,
        city: city || undefined,
      },
    }
    await onSubmit(payload)
  }

  const cityOptions = CITY_BY_COUNTRY[country] || []

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label className="grid gap-1">
        <span className="text-sm font-medium">Name *</span>
        <input className="rounded-lg border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} required />
      </label>

      <label className="grid gap-1">
        <span className="text-sm font-medium">Description</span>
        <textarea className="rounded-lg border px-3 py-2 min-h-28"
                  value={description} onChange={(e)=>setDescription(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Price per night *</span>
          <input type="number" min={1} className="rounded-lg border px-3 py-2"
                 value={price} onChange={(e)=>setPrice(Number(e.target.value))} required />
          <span className="text-xs text-gray-500">NOK / night (int)</span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">Max guests *</span>
          <input type="number" min={1} className="rounded-lg border px-3 py-2"
                 value={maxGuests} onChange={(e)=>setMaxGuests(Number(e.target.value))} required />
          <span className="text-xs text-gray-500">Total capacity for this venue</span>
        </label>
      </div>

      {/* GALLERY */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Images (gallery)</span>
          <button type="button" onClick={addImage} className="text-sm rounded-lg border px-3 py-1">
            + Add image
          </button>
        </div>

        {images.map((img, i) => (
          <div key={i} className="grid gap-2 rounded-xl border p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto] items-start">
              <input className="rounded-lg border px-3 py-2" placeholder="Image URL"
                     value={img.url} onChange={(e)=>updateImage(i,'url', e.target.value)} />
              <button type="button" onClick={()=>removeImage(i)} className="rounded-lg border px-3 py-2 text-sm">
                Remove
              </button>
            </div>
            <input className="rounded-lg border px-3 py-2" placeholder="Alt text (optional)"
                   value={img.alt} onChange={(e)=>updateImage(i,'alt', e.target.value)} />
          </div>
        ))}
        <p className="text-xs text-gray-500">Første bilde brukes som cover i lister; alle vises i galleriet.</p>
      </div>

      {/* LOCATION */}
      <div className="grid grid-cols-2 gap-4">
        <label className="grid gap-1">
          <span className="text-sm font-medium">Country</span>
          <select className="rounded-lg border px-3 py-2" value={country} onChange={(e)=>{setCountry(e.target.value); setCity('')}}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm font-medium">City</span>
          <select className="rounded-lg border px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)}>
            <option value="">—</option>
            {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      {/* AMENITIES */}
      <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={wifi} onChange={(e)=>setWifi(e.target.checked)} /> Wi-Fi</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={parking} onChange={(e)=>setParking(e.target.checked)} /> Parking</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={breakfast} onChange={(e)=>setBreakfast(e.target.checked)} /> Breakfast</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={pets} onChange={(e)=>setPets(e.target.checked)} /> Pets</label>
      </fieldset>

      <button disabled={!!submitting} className="rounded-lg bg-blue-600 text-white px-4 py-2">
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
