// src/pages/venues/VenueDetail.tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../utils/api'
import type { Venue, Booking } from '../../utils/types'
import type { Media, VenueMedia } from '../../utils/types'
type AnyMedia = Media | VenueMedia;
import { useAuth } from '../../stores/auth'

export default function VenueDetail() {
  const { id } = useParams()
  const [venue, setVenue] = useState<Venue | null>(null)
  const [nights, setNights] = useState(1)
  const [active, setActive] = useState(0) // gallery index
  const nav = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    (async () => {
      const res = await api.get<{ data: Venue }>(`/holidaze/venues/${id}`)
      setVenue(res.data)
      setActive(0)
    })()
  }, [id])

  async function book() {
    if (!user) return nav('/login', { replace: true })
    const start = new Date()
    const end = new Date(start.getTime() + nights * 24 * 60 * 60 * 1000)
    const payload = { dateFrom: start.toISOString(), dateTo: end.toISOString(), guests: 1, venueId: id }
    await api.post<{ data: Booking }>(`/holidaze/bookings`, payload)
    alert('Booking created!')
  }

  if (!venue) return <p>Loading…</p>

  const gallery = venue.media && venue.media.length ? venue.media : [{ url: 'https://picsum.photos/seed/holidaze/1280/720', alt: venue.name }]
  const main = gallery[Math.min(active, gallery.length - 1)]

  return (
    <section className="grid gap-6 lg:grid-cols-5">
      {/* Gallery */}
      <div className="lg:col-span-3 grid gap-3">
        <div className="rounded-2xl overflow-hidden">
          <img src={main.url} alt={main.alt ?? venue.name} className="w-full h-[360px] lg:h-[480px] object-cover" />
        </div>
        {gallery.length > 1 && (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {gallery.map((m: AnyMedia, i: number) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`rounded-xl overflow-hidden border ${i === active ? 'ring-2 ring-blue-600' : ''}`}
              >
                <img src={m.url} alt={m.alt ?? venue.name} className="w-full h-20 object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Details / booking */}
      <div className="lg:col-span-2 grid gap-4">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <div className="text-gray-700">{venue.description}</div>

        <div className="text-sm text-gray-600">
          {venue.location?.city && <span>{venue.location.city}</span>}
          {venue.location?.country && <span>{venue.location?.city ? ' · ' : ''}{venue.location.country}</span>}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="nights" className="text-sm">Nights</label>
          <input id="nights" type="number" min={1} value={nights}
                 onChange={(e)=>setNights(parseInt(e.target.value||'1'))}
                 className="w-24 rounded-lg border px-2 py-1" />
          <button onClick={book} className="rounded-xl bg-blue-600 text-white px-4 py-2">Book</button>
        </div>

        <div className="text-lg font-semibold">${venue.price} / night</div>

        <div className="text-sm text-gray-600">
          Max guests: {venue.maxGuests ?? 1}
        </div>

        <div className="text-sm text-gray-600">
          Amenities: {[
            venue.meta?.wifi ? 'Wi-Fi' : null,
            venue.meta?.parking ? 'Parking' : null,
            venue.meta?.breakfast ? 'Breakfast' : null,
            venue.meta?.pets ? 'Pets' : null,
          ].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>
    </section>
  )
}
