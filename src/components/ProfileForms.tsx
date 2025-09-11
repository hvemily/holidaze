// src/pages/profile/ProfileForms.tsx
import type { FormEvent } from 'react'
import { useState } from 'react'
import { api } from '@/utils/api'
import type { Profile as TProfile } from '@/utils/types'

export default function ProfileForms({
  name,
  profile,
  onUpdated
}: {
  name: string
  profile: TProfile
  onUpdated: (next: TProfile) => void
}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar?.url || '')
  const [bannerUrl, setBannerUrl] = useState(profile.banner?.url || '')
  const [err, setErr] = useState<string | null>(null)

  async function updateAvatar(e: FormEvent) {
    e.preventDefault()
    try {
      setErr(null)
      await api.put<{ data: TProfile }>(`/holidaze/profiles/${encodeURIComponent(name)}/media`, {
        avatar: { url: avatarUrl, alt: `${name}'s avatar` },
      })
      const p = await api.get<{ data: TProfile }>(`/holidaze/profiles/${encodeURIComponent(name)}`)
      onUpdated(p.data)
      alert('Avatar updated')
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Failed to update avatar')
    }
  }

  async function updateBanner(e: FormEvent) {
    e.preventDefault()
    try {
      setErr(null)
      await api.put<{ data: TProfile }>(`/holidaze/profiles/${encodeURIComponent(name)}/media`, {
        banner: { url: bannerUrl, alt: `${name}'s header` },
      })
      const p = await api.get<{ data: TProfile }>(`/holidaze/profiles/${encodeURIComponent(name)}`)
      onUpdated(p.data)
      alert('Header background updated')
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Failed to update header')
    }
  }

  return (
    <div className="grid gap-6 max-w-lg">
      {err && <p className="text-sm text-red-600">{err}</p>}

      <form onSubmit={updateAvatar} className="grid gap-2">
        <label className="text-sm font-medium">Avatar URL</label>
        <input
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="https://…"
        />
        <button className="rounded-lg bg-black text-white px-4 py-2 w-fit">
          Update avatar
        </button>
        <p className="text-xs text-gray-500">Tip: minst 256×256 for skarp avatar.</p>
      </form>

      <form onSubmit={updateBanner} className="grid gap-2">
        <label className="text-sm font-medium">Header background URL</label>
        <input
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="https://…"
        />
        <button className="rounded-lg bg-black text-white px-4 py-2 w-fit">
          Update header
        </button>
        <p className="text-xs text-gray-500">Vises øverst på profilen din.</p>
      </form>
    </div>
  )
}
