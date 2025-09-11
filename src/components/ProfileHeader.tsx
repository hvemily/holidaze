// src/pages/profile/ProfileHeader.tsx
import type { Profile as TProfile } from '@/utils/types'

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'
const FALLBACK_AVATAR = 'https://i.pravatar.cc/100?u=holidaze'

export default function ProfileHeader({ profile }: { profile: TProfile }) {
  const bannerSrc = profile.banner?.url || FALLBACK_BANNER
  const avatarSrc = profile.avatar?.url || FALLBACK_AVATAR

  return (
    <div className="relative">
      <div className="h-40 w-full rounded-xl overflow-hidden">
        <img
          src={bannerSrc}
          alt={profile.banner?.alt || `${profile.name}'s header`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="-mt-10 flex items-center gap-4 px-2">
        <img
          src={avatarSrc}
          alt={profile.avatar?.alt || profile.name}
          className="h-20 w-20 rounded-full object-cover border-4 border-white shadow"
        />
        <div>
          <h1 className="text-2xl font-bold">{profile.name}</h1>
          <div className="text-sm text-gray-600">{profile.email}</div>
          <span className="inline-block mt-1 rounded-full border px-2 py-0.5 text-xs">
            {profile.venueManager ? 'Venue Manager' : 'Customer'}
          </span>
        </div>
      </div>
    </div>
  )
}
