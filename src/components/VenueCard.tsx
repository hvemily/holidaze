// src/components/VenueCard.tsx
import { Link } from 'react-router-dom'
import type { Venue } from '@/utils/types'
import RatingStars from '@/components/RatingStars'

type Props = { venue: Venue }

export default function VenueCard({ venue: v }: Props) {
  const img = v.media?.[0]?.url ?? 'https://picsum.photos/seed/holidaze/640/480'
  const city = v.location?.city || 'Unknown city'
  const country = v.location?.country || 'Unknown country'
  const price = Number(v.price) || 0

  return (
    <Link
      to={`/venues/${v.id}`}
      className="
        group block rounded-2xl overflow-hidden bg-white shadow border
        transform transition duration-200
        hover:shadow-lg hover:scale-[1.02]
        focus:outline-none focus:ring-2 focus:ring-[#5285A5]
      "
      aria-label={`${v.name} in ${city}, ${country} — $${price} per night. View details.`}
    >
      <img
        src={img}
        alt={v.media?.[0]?.alt ?? v.name}
        className="h-48 w-full object-cover transition group-hover:opacity-95"
        loading="lazy"
      />

      <div className="p-4 grid gap-2">
        <h3 className="font-semibold line-clamp-1 text-[#1B5071] group-hover:underline">
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
          <span className="text-xs text-[#5285A5]">
            View details →
          </span>
        </div>
      </div>
    </Link>
  )
}
