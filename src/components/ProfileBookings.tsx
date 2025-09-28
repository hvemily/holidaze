// src/pages/profile/ProfileBookings.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Booking } from '@/utils/types'
import { api } from '@/utils/api'
import Modal from '@/components/Modal'
import { useToast } from '@/components/Toast' 
import Spinner from '@/components/Spinner'

/**
 * list of the user's bookings with edit & cancel flows.
 *
 * - edit opens a modal with basic validation (dates + guests).
 * - cancel uses an optimistic update with rollback on failure.
 * - uses toasts to provide feedback.
 */
export default function ProfileBookings({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initial)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)

  // cancel flow
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { success: toastSuccess, error: toastError } = useToast()

  if (bookings.length === 0) {
    return <p className="text-gray-600">No upcoming bookings.</p>
  }

  function requestCancel(id: string) {
    setConfirmId(id)
  }

  async function confirmCancel() {
    if (!confirmId) return

    // keep a snapshot for rollback
    const prev = bookings
    setDeleting(true)

    // optimistic remove
    setBookings((b) => b.filter((x) => x.id !== confirmId))

    try {
      await api.delete(`/holidaze/bookings/${encodeURIComponent(confirmId)}`)
      toastSuccess('Booking cancelled')
      setConfirmId(null)
    } catch (err) {
      // rollback on error
      setBookings(prev)
      const msg =
        err instanceof Error ? err.message : 'Failed to cancel booking. Please try again.'
      toastError(msg)
    } finally {
      setDeleting(false)
    }
  }

  function startEdit(b: Booking) {
    setEditing(b)
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editing) return

    const form = new FormData(e.currentTarget)
    const dateFrom = (form.get('dateFrom') as string)?.trim()
    const dateTo = (form.get('dateTo') as string)?.trim()
    const guests = Number(form.get('guests') || 1)

    // basic validation + toasts
    if (!dateFrom || !dateTo) {
      toastError('Please choose dates.')
      return
    }
    if (new Date(dateFrom) >= new Date(dateTo)) {
      toastError('End date must be after start date.')
      return
    }
    if (guests < 1) {
      toastError('Guests must be at least 1.')
      return
    }

    setSaving(true)
    try {
      const { data } = await api.put<{ data: Booking }>(
        `/holidaze/bookings/${encodeURIComponent(editing.id)}`,
        {
          dateFrom: new Date(dateFrom).toISOString(),
          dateTo: new Date(dateTo).toISOString(),
          guests,
        }
      )

      // merge the updated booking back into the list
      setBookings((list) => list.map((b) => (b.id === editing.id ? { ...b, ...data } : b)))
      setEditing(null)
      toastSuccess('Booking updated')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Failed to update booking. Please try again.'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="grid gap-3">
        {bookings.map((b) => (
          <article key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">
                {b.venue?.name || 'Venue'} · {formatDateRange(b.dateFrom, b.dateTo)}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to={`/venues/${b.venue?.id || ''}`}
                  className="text-sm underline"
                  title="View venue"
                >
                  View
                </Link>
                <button
                  onClick={() => startEdit(b)}
                  className="rounded border px-3 py-1 text-sm"
                  disabled={deleting}
                  type="button"
                >
                  Edit
                </button>
                <button
                  onClick={() => requestCancel(b.id)}
                  className="rounded border border-red-300 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
                  disabled={deleting}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Guests: {b.guests} {b.venue?.location?.city ? `· ${b.venue.location.city}` : ''}
            </div>
          </article>
        ))}
      </div>

      {/* edit modal */}
      <Modal
        open={!!editing}
        onClose={saving ? () => {} : () => setEditing(null)}
        title="Edit booking"
      >
        {editing && (
          <form onSubmit={saveEdit} className="grid w-[min(90vw,420px)] gap-3">
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="pb-dateFrom">
                Start
              </label>
              <input
                id="pb-dateFrom"
                type="date"
                name="dateFrom"
                className="rounded border px-3 py-2"
                defaultValue={toInputDate(editing.dateFrom)}
                min={toInputDate(new Date().toISOString())}
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="pb-dateTo">
                End
              </label>
              <input
                id="pb-dateTo"
                type="date"
                name="dateTo"
                className="rounded border px-3 py-2"
                defaultValue={toInputDate(editing.dateTo)}
                min={toInputDate(editing.dateFrom)}
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium" htmlFor="pb-guests">
                Guests
              </label>
              <input
                id="pb-guests"
                type="number"
                name="guests"
                min={1}
                className="w-28 rounded border px-3 py-2"
                defaultValue={editing.guests || 1}
                required
              />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={saving}
                aria-busy={saving}
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded border px-4 py-2"
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* cancel confirm modal */}
      <Modal
        open={!!confirmId}
        onClose={deleting ? () => {} : () => setConfirmId(null)}
        title="Cancel this booking?"
      >
        <div className="grid w-[min(90vw,420px)] gap-3">
          <p className="text-sm text-gray-700">Are you sure you want to cancel this booking?</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              onClick={() => setConfirmId(null)}
              disabled={deleting}
            >
              Keep booking
            </button>
            <button
              type="button"
              className="rounded bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              onClick={confirmCancel}
              disabled={deleting}
              aria-busy={deleting}
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" inline /> Deleting…
                </span>
              ) : (
                'Cancel booking'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/* utils */

/** format a date range like "jan 2, 2025 → jan 4, 2025". */
function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return `${f.toLocaleDateString(undefined, opts)} → ${t.toLocaleDateString(
    undefined,
    opts
  )}`
}

/** convert ISO string to yyyy-mm-dd for `<input type="date">` (local time). */
function toInputDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
