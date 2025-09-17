// src/components/VenueCard.tsx
import { Link } from 'react-router-dom'
import type { Venue } from '@/utils/types'

type Props = { venue: Venue }

export default function VenueCard({ venue: v }: Props) {
  const img = v.media?.[0]?.url ?? 'https://picsum.photos/seed/holidaze/640/480'
  return (
    <article className="rounded-2xl overflow-hidden bg-white shadow border hover:shadow-md transition">
      <img src={img} alt={v.media?.[0]?.alt ?? v.name} className="h-48 w-full object-cover" />
      <div className="p-4 grid gap-2">
        <h3 className="font-semibold line-clamp-1">{v.name}</h3>
        <p className="text-xs text-gray-400">{new Date(v.created).toLocaleString()}</p>
        <p className="text-sm text-gray-600 line-clamp-2">{v.description}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">${v.price} /night</span>
          <Link className="rounded-lg border px-3 py-1" to={`/venues/${v.id}`}>View</Link>
        </div>
      </div>
    </article>
  )
}
