// src/pages/profile/ProfileForms.tsx
import type { FormEvent } from 'react'
import { useState } from 'react'
import { api } from '@/utils/api'
import type { Profile as TProfile } from '@/utils/types'
import { useToast } from './Toast'

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
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { success: toastSuccess, error: toastError } = useToast()

  const isHttpUrl = (u: string) => /^https?:\/\/.+/i.test(u.trim())

  async function updateAvatar(e: FormEvent) {
    e.preventDefault()
    const url = avatarUrl.trim()

    if (!isHttpUrl(url)) {
      const msg = 'Please enter a valid http(s) image URL for avatar.'
      setErr(msg)
      toastError(msg)
      return
    }
    try {
      setErr(null)
      setSaving(true)

      await api.put<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}`,
        { avatar: { url, alt: `${name}'s avatar` } }
      )

      const p = await api.get<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}`
      )
      onUpdated(p.data)
      toastSuccess('Avatar updated')
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to update avatar'
      setErr(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 max-w-lg">
      {err && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {err}
        </p>
      )}

      <form onSubmit={updateAvatar} className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="avatar-url">Avatar URL</label>
        <input
          id="avatar-url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="rounded-lg border px-3 py-2"
          placeholder="https://…"
          inputMode="url"
          aria-invalid={!!err}
        />

        {/* enkel forhåndsvisning hvis URL ser gyldig ut */}
        {isHttpUrl(avatarUrl) && (
          <div className="mt-1">
            <img
              src={avatarUrl}
              alt={`${name}'s avatar preview`}
              className="h-20 w-20 rounded-full object-cover border"
              loading="lazy"
              onError={() => setErr('Could not load image from this URL.')}
            />
          </div>
        )}

        <button
          className="rounded-lg bg-black text-white px-4 py-2 w-fit disabled:opacity-50"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'Saving…' : 'Update avatar'}
        </button>
        <p className="text-xs text-gray-500">Tip: at least 256×256 for a sharp avatar.</p>
      </form>
    </div>
  )
}
