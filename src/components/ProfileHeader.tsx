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
    <div className="relative">
      {/* Full-width banner */}
      <div
        className="
          relative z-0
          w-screen ml-[calc(50%-50vw)] mr-[calc(50%-50vw)]
          h-48 sm:h-56 md:h-64 lg:h-72
        "
      >
  <img
    src={BANNER_URL}
    alt="Profile banner"
    className="absolute inset-0 h-full w-full object-cover object-[center_65%]"
    fetchPriority="high"
  />


        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/5 to-transparent" />
      </div>

      {/* Profilinfo */}
      <div className="max-w-3xl mx-auto -mt-14 sm:-mt-20 px-4 text-center relative z-10">
        <img
          src={avatarUrl}
          alt={profile.avatar?.alt || `Avatar for ${profile.name}`}
          className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover ring-4 ring-white shadow-md mx-auto relative z-10"
        />

        <h1 className="mt-4 text-2xl md:text-3xl font-extrabold tracking-tight">
          {profile.name}
        </h1>

        {profile.email && (
          <p className="mt-1 text-sm md:text-base text-gray-600">{profile.email}</p>
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
  )
}
