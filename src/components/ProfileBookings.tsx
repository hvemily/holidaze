// src/pages/profile/ProfileBookings.tsx
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Booking } from '@/utils/types'
import { api } from '@/utils/api'
import Modal from '@/components/Modal'
import { useToast } from './Toast'
import Spinner from '@/components/Spinner'

export default function ProfileBookings({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState<Booking[]>(initial)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [saving, setSaving] = useState(false)

  // Cancel flow
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
    const prev = bookings
    setDeleting(true)

    // Optimistisk fjern
    setBookings(b => b.filter(x => x.id !== confirmId))
    try {
      await api.delete(`/holidaze/bookings/${encodeURIComponent(confirmId)}`)
      toastSuccess('Booking cancelled')
      setConfirmId(null)
    } catch (err) {
      // Revert ved feil
      setBookings(prev)
      const msg = err instanceof Error ? err.message : 'Failed to cancel booking. Please try again.'
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

    // enkel validering + toasts
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
      // Oppdater i lista
      setBookings(list => list.map(b => (b.id === editing.id ? { ...b, ...data } : b)))
      setEditing(null)
      toastSuccess('Booking updated')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update booking. Please try again.'
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
                <Link to={`/venues/${b.venue?.id || ''}`} className="text-sm underline">
                  View
                </Link>
                <button
                  onClick={() => startEdit(b)}
                  className="text-sm rounded border px-3 py-1"
                  disabled={deleting}
                >
                  Edit
                </button>
                <button
                  onClick={() => requestCancel(b.id)}
                  className="text-sm rounded border px-3 py-1 text-red-600 border-red-300 disabled:opacity-50"
                  disabled={deleting}
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Guests: {b.guests}{' '}
              {b.venue?.location?.city ? `· ${b.venue.location.city}` : ''}
            </div>
          </article>
        ))}
      </div>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => (saving ? null : setEditing(null))} title="Edit booking">
        {editing && (
          <form onSubmit={saveEdit} className="grid gap-3 w-[min(90vw,420px)]">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Start</label>
              <input
                type="date"
                name="dateFrom"
                className="rounded border px-3 py-2"
                defaultValue={toInputDate(editing.dateFrom)}
                min={toInputDate(new Date().toISOString())}
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">End</label>
              <input
                type="date"
                name="dateTo"
                className="rounded border px-3 py-2"
                defaultValue={toInputDate(editing.dateTo)}
                min={toInputDate(editing.dateFrom)}
                required
              />
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Guests</label>
              <input
                type="number"
                name="guests"
                min={1}
                className="rounded border px-3 py-2 w-28"
                defaultValue={editing.guests || 1}
                required
              />
            </div>

            <div className="mt-2 flex items-center gap-2">
              <button
                type="submit"
                className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
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

      {/* Cancel confirm modal */}
      <Modal
        open={!!confirmId}
        onClose={() => (deleting ? null : setConfirmId(null))}
        title="Cancel this booking?"
      >
        <div className="grid gap-3 w-[min(90vw,420px)]">
          <p className="text-sm text-gray-700">
            Are you sure you want to cancel this booking?
          </p>
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
              className="rounded bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50"
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
function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return `${f.toLocaleDateString(undefined, opts)} → ${t.toLocaleDateString(undefined, opts)}`
}

function toInputDate(iso: string) {
  // yyyy-mm-dd for <input type="date">
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
