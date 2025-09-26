// src/components/EditAvatarModal.tsx
import { useState, type FormEvent } from 'react'
import Modal from '@/components/Modal'
import { api } from '@/utils/api'
import type { Profile as TProfile } from '@/utils/types'
import { useToast } from '@/components/Toast'

/** Fast, cheap URL check aimed at http(s) images only. */
const IS_HTTP_RE = /^https?:\/\/\S+/i
const isHttpUrl = (u: string) => IS_HTTP_RE.test(u.trim())

/** Build a human-friendly alt text for the avatar image. */
const avatarAlt = (name: string) => `${name}'s avatar`

/**
 * Modal for updating the user's avatar URL.
 *
 * - Validates that the value looks like an http(s) URL before submitting.
 * - Shows a lightweight live preview when the URL resembles http(s).
 * - Prevents closing while saving to avoid accidental cancellation.
 *
 * @param open Controls visibility of the modal.
 * @param onClose Called when the modal should be closed (disabled while saving).
 * @param name Profile handle / name used in the API path (URL-encoded).
 * @param profile Current profile object (used to seed the input).
 * @param onUpdated Callback invoked with the updated profile after success.
 */
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
  const [previewErr, setPreviewErr] = useState<string | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()

  /**
   * Handle form submit:
   * - Guard on basic URL validity
   * - PUT to update the avatar
   * - Prefer the response payload from PUT (avoids an extra GET roundtrip)
   * - Fallback: if API doesn’t return updated profile, re-fetch it
   */
  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    const clean = url.trim()
    if (!isHttpUrl(clean)) {
      const msg = 'Please enter a valid http(s) image URL.'
      setErr(msg)
      toastError(msg)
      return
    }

    try {
      setSaving(true)
      setErr(null)

      // Attempt to update avatar
      const res = await api.put<{ data?: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}`,
        { avatar: { url: clean, alt: avatarAlt(name) } },
      )

      // Use returned profile if present; otherwise fetch fresh to keep header in sync.
      let updated = res.data
      if (!updated) {
        const refetch = await api.get<{ data: TProfile }>(
          `/holidaze/profiles/${encodeURIComponent(name)}`
        )
        updated = refetch.data
      }

      onUpdated(updated!)
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
    <Modal
      open={open}
      // While saving, disable closing to avoid accidental loss of progress.
      onClose={saving ? () => {} : onClose}
      title="Edit profile picture"
    >
      <form onSubmit={onSubmit} className="grid w-[min(90vw,460px)] gap-3">
        {/* Inline error for validation/submit failures */}
        {err && (
          <p className="text-sm text-red-600" role="alert" aria-live="polite">
            {err}
          </p>
        )}

        <label className="text-sm font-medium" htmlFor="avatar-url">
          Avatar URL
        </label>
        <input
          id="avatar-url"
          type="url"
          className="rounded-lg border px-3 py-2"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value)
            // Clear previous errors as the user edits
            if (err) setErr(null)
            if (previewErr) setPreviewErr(null)
          }}
          placeholder="https://…"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          required
          aria-invalid={Boolean(err)}
          aria-describedby={previewErr ? 'avatar-preview-error' : undefined}
        />

        {/* Live preview if it looks like an http(s) URL */}
        {isHttpUrl(url) && (
          <div className="mt-1 flex items-center gap-3">
            <img
              src={url}
              alt={`${name}'s avatar preview`}
              className="h-20 w-20 rounded-full object-cover border"
              loading="lazy"
              onError={() => setPreviewErr('Could not load image from this URL.')}
            />
            <div className="flex flex-col">
              <p className="text-xs text-gray-500">
                Tip: use at least 256×256 for a sharp avatar.
              </p>
              {previewErr && (
                <p
                  id="avatar-preview-error"
                  className="text-xs text-red-600"
                  role="status"
                  aria-live="polite"
                >
                  {previewErr}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className="rounded-xl border border-holi-nav bg-holi-nav px-4 py-2 text-sm font-normal text-white hover:bg-holi-nav/90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update avatar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
