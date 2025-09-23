// src/components/ProfileHeader.tsx
import type { Profile as TProfile } from '@/utils/types'

const BANNER_URL =
  'https://images.unsplash.com/photo-1723809887047-bc7a1b39bd5c?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'

export default function ProfileHeader({ profile }: { profile: TProfile }) {
  const avatarUrl =
    profile.avatar?.url?.trim() && /^https?:\/\//i.test(profile.avatar.url)
      ? profile.avatar.url
      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
          profile.name
        )}&backgroundType=gradientLinear`

  return (
    <header className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
      {/* Banner */}
      <div className="relative h-52 sm:h-60 md:h-72 lg:h-80">
        <img
          src={BANNER_URL}
          alt="Profile banner"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        {/* lett mørkning for kontrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-transparent" />
        {/* myk fade til hvitt nederst */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent via-white/80 to-white" />
      </div>

      {/* Centered info */}
      <div className="px-6 pb-12">
        <div className="-mt-24 md:-mt-28 flex flex-col items-center text-center">
          <img
            src={avatarUrl}
            alt={profile.avatar?.alt || `Initials avatar for ${profile.name}`}
            className="relative z-10 h-32 w-32 md:h-36 md:w-36 rounded-full object-cover ring-4 ring-white shadow-md"
          />

          <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
            {profile.name}
          </h1>

          {profile.email && (
            <p className="mt-1 text-sm md:text-base text-gray-600">
              {profile.email}
            </p>
          )}

          <span
            className={`mt-3 inline-block rounded-full border px-3 py-1 text-xs font-medium ${
              profile.venueManager
                ? 'border-indigo-300 text-indigo-700'
                : 'border-gray-300 text-gray-600'
            }`}
            aria-label={profile.venueManager ? 'Venue Manager' : 'Customer'}
          >
            {profile.venueManager ? 'Venue Manager' : 'Customer'}
          </span>
        </div>
      </div>
    </header>
  )
}
