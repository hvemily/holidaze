// src/components/VenueCard.tsx
import { Link } from 'react-router-dom'
import type { Venue } from '@/utils/types'
import RatingStars from '@/components/RatingStars'

type Props = { venue: Venue }

/**
 * Compact card for a venue.
 * - Clickable wrapper navigates to venue detail.
 * - Shows cover image, name, rating, location and price.
 */
export default function VenueCard({ venue: v }: Props) {
  const img = v.media?.[0]?.url ?? 'https://picsum.photos/seed/holidaze/640/480'
  const alt = v.media?.[0]?.alt ?? v.name
  const city = v.location?.city || 'Unknown city'
  const country = v.location?.country || 'Unknown country'
  const price = Number(v.price) || 0

  return (
    <Link
      to={`/venues/${v.id}`}
      className="
        group block overflow-hidden rounded-2xl border bg-white shadow
        transform transition duration-200
        hover:scale-[1.02] hover:shadow-lg
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5285A5]
      "
      title={`${v.name} — ${city}, ${country}`}
    >
      {/* Cover image */}
      <img
        src={img}
        alt={alt}
        className="h-48 w-full object-cover transition group-hover:opacity-95"
        loading="lazy"
        decoding="async"
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
      />

      <div className="grid gap-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-[#1B5071] group-hover:underline">
          {v.name}
        </h3>

        <div className="flex items-center">
          <RatingStars value={Number(v.rating) || 0} size="sm" showNumber />
        </div>

        <p className="text-sm text-gray-600">
          {city}, {country}
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">${price} /night</span>
          <span className="text-xs text-[#5285A5]">View details →</span>
        </div>
      </div>
    </Link>
  )
}
