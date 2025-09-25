// src/pages/manager/VenueForm.tsx
import { useEffect, useMemo, useState } from 'react'
import type { Venue } from '@/utils/types'
import RatingStars from '@/components/RatingStars'
import { useToast } from '@/components/Toast'


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

type MediaItem = { url: string; alt: string }

export default function VenueForm({ initial, onSubmit, submitting }: Props) {
  const { error: toastError } = useToast()

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState<number>(Number(initial?.price) || 0)
  const [rating, setRating] = useState<number>(Number(initial?.rating) || 0)
  const [maxGuests, setMaxGuests] = useState<number>(Number(initial?.maxGuests) || 1)

  // 🔁 Media as dynamic list (index 0 = cover)
  const [media, setMedia] = useState<MediaItem[]>(
    initial?.media?.length
      ? initial.media.map(m => ({ url: m?.url ?? '', alt: m?.alt ?? '' }))
      : [{ url: '', alt: '' }]
  )

  const [address, setAddress] = useState(initial?.location?.address ?? '')
  const [city, setCity] = useState(initial?.location?.city ?? '')
  const [country, setCountry] = useState(initial?.location?.country ?? '')
  const [wifi, setWifi] = useState<boolean>(!!initial?.meta?.wifi)
  const [breakfast, setBreakfast] = useState<boolean>(!!initial?.meta?.breakfast)
  const [parking, setParking] = useState<boolean>(!!initial?.meta?.parking)
  const [pets, setPets] = useState<boolean>(!!initial?.meta?.pets)

  // 🔎 enkel valideringsstatus
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    if (!initial) return
    setName(initial.name ?? '')
    setDescription(initial.description ?? '')
    setPrice(Number(initial.price) || 0)
    setRating(Number(initial.rating) || 0)
    setMaxGuests(Number(initial.maxGuests) || 1)

    setMedia(
      initial.media?.length
        ? initial.media.map(m => ({ url: m?.url ?? '', alt: m?.alt ?? '' }))
        : [{ url: '', alt: '' }]
    )

    setAddress(initial.location?.address ?? '')
    setCity(initial.location?.city ?? '')
    setCountry(initial.location?.country ?? '')
    setWifi(!!initial.meta?.wifi)
    setBreakfast(!!initial.meta?.breakfast)
    setParking(!!initial.meta?.parking)
    setPets(!!initial.meta?.pets)
  }, [initial])

  // 🧠 helpers
  function setMediaField(i: number, field: keyof MediaItem, value: string) {
    setMedia(prev => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)))
  }
  function addImageRow() {
    setMedia(prev => [...prev, { url: '', alt: '' }])
  }
  function removeImageRow(i: number) {
    setMedia(prev => (prev.length <= 1 ? [{ url: '', alt: '' }] : prev.filter((_, idx) => idx !== i)))
  }
  function moveUp(i: number) {
    if (i <= 0) return
    setMedia(prev => {
      const next = [...prev]
      ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
      return next
    })
  }
  function moveDown(i: number) {
    setMedia(prev => {
      if (i >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[i + 1], next[i]] = [next[i], next[i + 1]]
      return next
    })
  }
  const isUrlOk = (u: string) => /^https?:\/\//i.test(u.trim())

  const hasInvalidImageUrl = useMemo(
    () => media.some(m => m.url.trim().length > 0 && !isUrlOk(m.url)),
    [media]
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: string[] = []

    // Basal validering
    if (!name.trim()) nextErrors.push('Name is required.')
    if (price < 0) nextErrors.push('Price cannot be negative.')
    if (rating < 0 || rating > 5) nextErrors.push('Rating must be between 0 and 5.')
    if (maxGuests < 1) nextErrors.push('Max guests must be at least 1.')

    // URL-validering
    const invalidUrls = media
      .map((m, i) => ({ i, url: m.url.trim() }))
      .filter(m => m.url && !isUrlOk(m.url))
      .map(m => m.i)

    if (invalidUrls.length > 0) {
      nextErrors.push('One or more image URLs are invalid (must start with http:// or https://).')
    }

    setErrors(nextErrors)

    if (nextErrors.length > 0) {
      toastError(nextErrors[0]) // vis første feil som toast
      return
    }

    const cleanedMedia =
      media
        .map(m => ({ url: m.url.trim(), alt: (m.alt || name).trim() }))
        .filter(m => m.url.length > 0) // bare send de som faktisk har URL
        .slice(0, 12) // en fornuftig øvre grense

    const payload: VenuePayload = {
      name: name.trim(),
      description: description?.trim() || undefined,
      price: Number(price) || 0,
      rating: Number(rating) || 0,
      maxGuests: Math.max(1, Number(maxGuests) || 1),
      media: cleanedMedia, // 👈 cover + additional images
      location: {
        address: address?.trim() || undefined,
        city: city?.trim() || undefined,
        country: country?.trim() || undefined,
      },
      meta: { wifi, breakfast, parking, pets },
    }

    onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 max-w-2xl pb-24" noValidate>
      {/* Feilsammendrag (vises hvis noe er feil) */}
      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <ul className="list-disc ml-4">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-name">Name</label>
        <input
          id="vf-name"
          className="rounded border px-3 py-2"
          value={name}
          onChange={e=>setName(e.target.value)}
          required
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-desc">Description</label>
        <textarea
          id="vf-desc"
          className="rounded border px-3 py-2 min-h-24"
          value={description}
          onChange={e=>setDescription(e.target.value)}
        />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-price">Price (per night)</label>
        <input
          id="vf-price"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          pattern="[0-9]*"
          className="no-spinner rounded border px-3 py-2 w-40"
          value={price}
          onChange={(e) => setPrice(Number(e.target.value) || 0)}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()} // hindrer scroll-zoom på tall
          required
        />
      </div>


      {/* ⭐ Rating */}
      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-rating">Rating</label>
        <div className="flex items-center gap-3">
          <input
            id="vf-rating"
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
        <label className="text-sm font-medium" htmlFor="vf-guests">Max guests</label>
        <input
          id="vf-guests"
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

      {/* 🖼️ Images (optional) */}
      <fieldset className="grid gap-3 border rounded-lg p-3">
        <legend className="px-1 text-sm font-medium">Images (optional)</legend>

        {media.map((m, i) => {
          const urlOk = !m.url || isUrlOk(m.url)
          const urlId = `vf-img-url-${i}`
          const errId = `vf-img-url-error-${i}`
          return (
            <div key={i} className="grid gap-2 border rounded p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {i === 0 ? 'Cover image' : `Additional image ${i}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveUp(i)}
                    className="text-xs rounded border px-2 py-1 disabled:opacity-40"
                    disabled={i === 0}
                    aria-label="Move image up"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(i)}
                    className="text-xs rounded border px-2 py-1 disabled:opacity-40"
                    disabled={i === media.length - 1}
                    aria-label="Move image down"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImageRow(i)}
                    className="text-xs rounded border px-2 py-1"
                    aria-label="Remove image"
                    title="Remove"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid gap-1">
                <label className="text-sm" htmlFor={urlId}>Image URL</label>
                <input
                  id={urlId}
                  className={`rounded border px-3 py-2 ${urlOk ? '' : 'border-red-500'}`}
                  placeholder="https://…"
                  value={m.url}
                  onChange={e => setMediaField(i, 'url', e.target.value)}
                  aria-invalid={!urlOk}
                  aria-describedby={!urlOk ? errId : undefined}
                />
                {!urlOk && (
                  <p id={errId} className="text-xs text-red-600">
                    Please enter a valid URL starting with http(s)://
                  </p>
                )}
              </div>

              <div className="grid gap-1">
                <label className="text-sm" htmlFor={`vf-img-alt-${i}`}>Image Alt (optional)</label>
                <input
                  id={`vf-img-alt-${i}`}
                  className="rounded border px-3 py-2"
                  placeholder={name || 'Describe the image'}
                  value={m.alt}
                  onChange={e => setMediaField(i, 'alt', e.target.value)}
                />
              </div>

              {/* tiny preview if URL exists */}
              {isUrlOk(m.url) && (
                <div className="mt-1">
                  <img
                    src={m.url}
                    alt={m.alt || name || `Preview ${i}`}
                    className="h-28 w-auto rounded border object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          )
        })}

        <div>
          <button
            type="button"
            onClick={addImageRow}
            className="rounded border px-3 py-2 text-sm"
          >
            + Add image
          </button>
          <p className="mt-1 text-xs text-gray-600">
            Tip: Top image is used as the cover. You can reorder with ↑ / ↓.
          </p>
        </div>
      </fieldset>

      {/* 📍 Location */}
      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-address">Address</label>
        <input id="vf-address" className="rounded border px-3 py-2" value={address} onChange={e=>setAddress(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-city">City</label>
        <input id="vf-city" className="rounded border px-3 py-2" value={city} onChange={e=>setCity(e.target.value)} />
      </div>

      <div className="grid gap-1">
        <label className="text-sm font-medium" htmlFor="vf-country">Country</label>
        <input id="vf-country" className="rounded border px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)} />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          disabled={submitting || hasInvalidImageUrl}
          aria-busy={submitting}
        >
          {/* {submitting ? <span className="flex items-center gap-2"><Spinner size="sm" inline /> Saving…</span> : 'Save'} */}
          {submitting ? 'Saving…' : 'Save'}
        </button>
        {hasInvalidImageUrl && (
          <span className="text-sm text-red-600 self-center" role="status" aria-live="polite">
            Fix invalid image URLs to continue.
          </span>
        )}
      </div>
    </form>
  )
}
