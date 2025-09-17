// src/pages/manager/VenueForm.tsx
import { useEffect, useState } from 'react'
import type { Venue } from '@/utils/types'
import RatingStars from '@/components/RatingStars'

export type VenuePayload = {
  name: string
  description?: string
  price: number
  rating?: number
  maxGuests?: number
  media?: Array<{ url: string; alt?: string }>
  location?: {
    address?: string
    city?: string
    country?: string
  }
  meta?: {
    wifi?: boolean
    parking?: boolean
    breakfast?: boolean
    pets?: boolean
  }
}

type Props = {
  initial?: Venue
  onSubmit: (payload: VenuePayload) => void | Promise<void>
  submitting?: boolean
}

export default function VenueForm({ initial, onSubmit, submitting }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState<number>(Number(initial?.price) || 0)
  const [rating, setRating] = useState<number>(Number(initial?.rating) || 0)
  const [maxGuests, setMaxGuests] = useState<number>(Number(initial?.maxGuests) || 1)
  const [imageUrl, setImageUrl] = useState(initial?.media?.[0]?.url ?? '')
  const [imageAlt, setImageAlt] = useState(initial?.media?.[0]?.alt ?? '')
  const [address, setAddress] = useState(initial?.location?.address ?? '')
  const [city, setCity] = useState(initial?.location?.city ?? '')
  const [country, setCountry] = useState(initial?.location?.country ?? '')
  const [wifi, setWifi] = useState<boolean>(!!initial?.meta?.wifi)
  const [breakfast, setBreakfast] = useState<boolean>(!!initial?.meta?.breakfast)
  const [parking, setParking] = useState<boolean>(!!initial?.meta?.parking)
  const [pets, setPets] = useState<boolean>(!!initial?.meta?.pets)

  useEffect(() => {
    if (!initial) return
    setName(initial.name ?? '')
    setDescription(initial.description ?? '')
    setPrice(Number(initial.price) || 0)
    setRating(Number(initial.rating) || 0)
    setMaxGuests(Number(initial.maxGuests) || 1)
    setImageUrl(initial.media?.[0]?.url ?? '')
    setImageAlt(initial.media?.[0]?.alt ?? '')
    setAddress(initial.location?.address ?? '')
    setCity(initial.location?.city ?? '')
    setCountry(initial.location?.country ?? '')
    setWifi(!!initial.meta?.wifi)
    setBreakfast(!!initial.meta?.breakfast)
    setParking(!!initial.meta?.parking)
    setPets(!!initial.meta?.pets)
  }, [initial])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload: VenuePayload = {
      name,
      description,
      price: Number(price) || 0,
      rating: Number(rating) || 0,
      maxGuests: Math.max(1, Number(maxGuests) || 1),
      media: imageUrl ? [{ url: imageUrl, alt: imageAlt || name }] : [],
      location: { address, city, country },
      meta: { wifi, breakfast, parking, pets },
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-2xl pb-24">
      <div className="grid gap-1">
        <label className="text-sm font-medium">Name</label>
        <input className="rounded border px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Description</label>
        <textarea className="rounded border px-3 py-2 min-h-24" value={description} onChange={e=>setDescription(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Price (per night)</label>
        <input
          type="number" min={0}
          className="rounded border px-3 py-2 w-40"
          value={price}
          onChange={e=>setPrice(Number(e.target.value) || 0)}
          required
        />
      </div>

      {/* ⭐ Rating */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">Rating</label>
        <div className="flex items-center gap-3">
          <input
            type="range" min={0} max={5} step={0.5}
            value={rating}
            onChange={(e)=>setRating(Number(e.target.value))}
            className="w-48"
            aria-label="Rating from 0 to 5"
          />
          <RatingStars value={rating} size="md" showNumber />
        </div>
      </div>

      {/* 👥 Max guests */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">Max guests</label>
        <input
          type="number" min={1} max={50}
          className="rounded border px-3 py-2 w-40"
          value={maxGuests}
          onChange={e=>setMaxGuests(Math.max(1, Number(e.target.value) || 1))}
          required
        />
      </div>

      {/* 🧩 Amenities */}
      <div className="grid gap-2">
        <span className="text-sm font-medium">Amenities</span>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={wifi} onChange={e=>setWifi(e.target.checked)} /> Wifi
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={breakfast} onChange={e=>setBreakfast(e.target.checked)} /> Breakfast included
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={parking} onChange={e=>setParking(e.target.checked)} /> Parking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pets} onChange={e=>setPets(e.target.checked)} /> Pets
        </label>
      </div>

      {/* Media & location (som før) */}
      <div className="grid gap-1">
        <label className="text-sm font-medium">Image URL</label>
        <input className="rounded border px-3 py-2" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Image Alt</label>
        <input className="rounded border px-3 py-2" value={imageAlt} onChange={e=>setImageAlt(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Address</label>
        <input className="rounded border px-3 py-2" value={address} onChange={e=>setAddress(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">City</label>
        <input className="rounded border px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium">Country</label>
        <input className="rounded border px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button type="submit" className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
