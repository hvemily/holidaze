// src/components/ProfileHeader.tsx
import type { Profile } from '@/utils/types'

const FIXED_BANNER =
  'https://images.unsplash.com/photo-1724861290299-29c0bef6641f?w=1600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8bm9yd2VnaWFuJTIwZmpvcmR8ZW58MHx8MHx8fDA%3D'

export default function ProfileHeader({ profile }: { profile: Profile }) {
  const avatar =
    profile.avatar?.url ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
      profile.name
    )}&backgroundType=gradientLinear`

  return (
    <header className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      {/* Fast banner */}
      <div className="w-full h-28 sm:h-40 md:h-52 lg:h-60 bg-gray-100">
        <img
          src={FIXED_BANNER}
          alt="Norwegian fjord landscape"
          className="w-full h-full object-cover object-[center_30%]"
          fetchPriority="high"
        />
      </div>

      {/* Avatar + info */}
      <div className="px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 md:-mt-16 pb-4 sm:pb-6">
        <div className="flex flex-col items-center text-center">
          <img
            src={avatar}
            alt={profile.avatar?.alt || `${profile.name} avatar`}
            className="rounded-full border-4 border-white shadow-card h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 object-cover"
          />
          <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight">
            {profile.name}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{profile.email}</p>

          {profile.venueManager && (
            <span className="mt-2 inline-flex items-center rounded-full border px-3 py-1 text-xs sm:text-sm bg-white">
              Venue Manager
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
