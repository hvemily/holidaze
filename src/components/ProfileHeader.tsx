// src/components/ProfileHeader.tsx
import type { Profile } from '@/utils/types'

/** Fixed banner image shown at the top of all profiles. */
const FIXED_BANNER =
  'https://images.unsplash.com/photo-1724861290299-29c0bef6641f?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bm9yd2VnaWFuJTIwZmpvcmR8ZW58MHx8MHx8fDA%3D'

/**
 * Profile header component.
 * - Displays a fixed banner.
 * - Shows avatar, name, email, and "Venue Manager" badge.
 * - Falls back to a generated initials avatar if none is provided.
 */
export default function ProfileHeader({ profile }: { profile: Profile }) {
  const avatar =
    profile.avatar?.url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      profile.name
    )}&backgroundType=gradientLinear`

  return (
    <header className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Banner (fixed Unsplash image) */}
      <div className="h-28 w-full bg-gray-100 sm:h-40 md:h-52 lg:h-60">
        <img
          src={FIXED_BANNER}
          alt="Norwegian fjord landscape"
          className="h-full w-full object-cover object-[center_30%]"
          fetchPriority="high"
          decoding="async"
        />
      </div>

      {/* Avatar + profile info */}
      <div className="-mt-10 px-4 pb-4 sm:-mt-12 sm:px-6 sm:pb-6 md:-mt-16 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatar}
            alt={profile.avatar?.alt || `${profile.name}'s avatar`}
            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-card sm:h-24 sm:w-24 md:h-28 md:w-28"
            loading="lazy"
          />

          <h1 className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl md:text-3xl">
            {profile.name}
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">{profile.email}</p>

          {profile.venueManager && (
            <span
              className="mt-2 inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs sm:text-sm"
              aria-label="User is a venue manager"
            >
              Venue Manager
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
