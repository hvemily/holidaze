// src/pages/profile/ProfileVenuesList.tsx
import { Link } from 'react-router-dom'
import type { Venue } from '@/utils/types'

export default function ProfileVenuesList({
  venues,
  canEdit,
  onEdit,
  onDelete,
  onCreateClick,
}: {
  venues: Venue[]
  canEdit: boolean
  onEdit: (v: Venue) => void
  onDelete: (id: string) => void
  onCreateClick: () => void
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your venues</h2>
        {canEdit && (
          <button onClick={onCreateClick} className="rounded-lg bg-blue-600 text-white px-4 py-2">
            Create venue
          </button>
        )}
      </div>

      {venues.length === 0 ? (
        <p className="text-gray-600">You haven’t created any venues yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v) => {
            const img = v.media?.[0]?.url || 'https://picsum.photos/seed/venue/640/480'
            return (
              <article key={v.id} className="rounded-2xl overflow-hidden bg-white shadow border">
                <img src={img} alt={v.media?.[0]?.alt || v.name} className="h-40 w-full object-cover" />
                <div className="p-4 grid gap-2">
                  <h3 className="font-semibold line-clamp-1">{v.name}</h3>
                  <div className="text-sm text-gray-600">${v.price} /night</div>
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/venues/${v.id}`} className="rounded-lg border px-3 py-1 text-sm">
                      View
                    </Link>
                    {canEdit && (
                      <>
                        <button onClick={() => onEdit(v)} className="rounded-lg border px-3 py-1 text-sm">
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(v.id)}
                          className="rounded-lg border px-3 py-1 text-sm text-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
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
