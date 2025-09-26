// src/components/ProfileVenueList.tsx
import { Link } from 'react-router-dom'
import type { Venue } from '@/utils/types'

type Props = {
  venues: Venue[]
  canEdit?: boolean
  onEdit?: (v: Venue) => void
  onDelete?: (id: string) => void
  onCreateClick?: () => void
}

/**
 * List of venues belonging to a profile.
 *
 * - Shows fallback when there are no venues.
 * - Displays image, name, price, max guests.
 * - Provides "View" link always; "Edit" and "Delete" buttons only if `canEdit`.
 * - Optional "Create your first venue" CTA when no venues + `canEdit`.
 */
export default function ProfileVenueList({
  venues,
  canEdit = false,
  onEdit,
  onDelete,
  onCreateClick,
}: Props) {
  if (!venues || venues.length === 0) {
    return (
      <div className="grid place-items-center gap-3 py-8">
        <p className="text-gray-600">You have no venues yet.</p>
        {canEdit && (
          <button type="button" className="btn" onClick={onCreateClick}>
            Create your first venue
          </button>
        )}
      </div>
    )
  }

  return (
    <ul className="grid gap-4">
      {venues.map((v) => {
        const img =
          v.media?.[0]?.url || 'https://picsum.photos/seed/venue/320/240'

        return (
          <li key={v.id}>
            <article className="rounded-2xl border bg-white p-3 shadow-sm sm:p-4">
              {/* Layout: image + content */}
              <div className="grid grid-cols-[88px,1fr] gap-3 sm:grid-cols-[112px,1fr]">
                <img
                  src={img}
                  alt={v.media?.[0]?.alt || v.name}
                  className="h-20 w-22 rounded-xl object-cover sm:h-28 sm:w-28"
                  loading="lazy"
                />

                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3
                      className="truncate font-semibold"
                      title={v.name}
                    >
                      {v.name}
                    </h3>
                    <div className="shrink-0 text-sm text-gray-600">
                      ${v.price}{' '}
                      <span className="text-xs" aria-label="per night">
                        /night
                      </span>
                    </div>
                  </div>

                  <div className="mt-1 text-xs text-gray-500">
                    Max {Number(v.maxGuests || 1)} guest
                    {(v.maxGuests || 1) === 1 ? '' : 's'}
                  </div>

                  {/* Actions: grid on mobile, flex-wrap on larger screens */}
                  <div className="mt-3">
                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-2">
                      <Link
                        to={`/venues/${v.id}`}
                        className="btn px-3 py-1 text-xs sm:text-sm"
                      >
                        View
                      </Link>

                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="btn px-3 py-1 text-xs sm:text-sm"
                            onClick={() => onEdit?.(v)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn-danger px-3 py-1 text-xs sm:text-sm"
                            onClick={() => onDelete?.(v.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
