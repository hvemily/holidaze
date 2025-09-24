// src/components/EditAvatarModal.tsx
import { useState, type FormEvent } from 'react'
import Modal from '@/components/Modal'
import { api } from '@/utils/api'
import type { Profile as TProfile } from '@/utils/types'
import { useToast } from '@/components/Toast'

export default function EditAvatarModal({
  open,
  onClose,
  name,
  profile,
  onUpdated,
}: {
  open: boolean
  onClose: () => void
  name: string
  profile: TProfile
  onUpdated: (next: TProfile) => void
}) {
  const [url, setUrl] = useState(profile.avatar?.url || '')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  const isHttp = (u: string) => /^https?:\/\/.+/i.test(u.trim())

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = url.trim()
    if (!isHttp(clean)) {
      const msg = 'Please enter a valid http(s) image URL.'
      setErr(msg)
      toastError(msg)
      return
    }

    try {
      setSaving(true)
      setErr(null)

      await api.put<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}`,
        { avatar: { url: clean, alt: `${name}'s avatar` } }
      )

      // Fetch fresh profile so header updates immediately
      const p = await api.get<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}`
      )
      onUpdated(p.data)
      toastSuccess('Avatar updated')
      onClose()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update avatar'
      setErr(msg)
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={saving ? () => {} : onClose} title="Edit profile picture">
      <form onSubmit={onSubmit} className="grid gap-3 w-[min(90vw,460px)]">
        {err && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {err}
          </p>
        )}

        <label className="text-sm font-medium" htmlFor="avatar-url">Avatar URL</label>
        <input
          id="avatar-url"
          className="rounded-lg border px-3 py-2"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          inputMode="url"
          aria-invalid={!!err}
        />

        {/* live preview if looks like an URL */}
        {isHttp(url) && (
          <div className="mt-1 flex items-center gap-3">
            <img
              src={url}
              alt={`${name}'s avatar preview`}
              className="h-20 w-20 rounded-full object-cover border"
              loading="lazy"
              onError={() => setErr('Could not load image from this URL.')}
            />
            <p className="text-xs text-gray-500">Tip: at least 256×256 for a sharp avatar.</p>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 justify-end">
          <button type="button" className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn-solid" disabled={saving} aria-busy={saving}>
            {saving ? 'Saving…' : 'Update avatar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
