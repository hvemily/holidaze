// src/pages/profile/Profile.tsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { api } from '@/utils/api'
import type { Venue, Profile as TProfile, Booking } from '@/utils/types'
import Modal from '@/components/Modal'
import VenueForm, { type VenuePayload } from '@/pages/manager/VenueForm'
import { useProfileData } from '@/hooks/useProfileData'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileBookings from '@/components/ProfileBookings'
import ProfileVenuesList from '@/components/ProfileVenueList'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'
import EditAvatarModal from '@/components/EditAvatarModal'

type RouteParams = { name: string }
type BookingEx = Booking & { customer?: { name?: string } }
type VenueWithBookings = Venue & { bookings?: BookingEx[] }

export default function Profile() {
  const { name } = useParams<RouteParams>()
  const { user } = useAuth()
  const { profile, bookings, venues, setVenues, loading, error, setProfile } =
    useProfileData(name)
  const { success: toastSuccess, error: toastError } = useToast()

  const isSelf =
    !!(user?.name && name) && user.name.toLowerCase() === name.toLowerCase()

  // Modals
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)
  const [openEditProfile, setOpenEditProfile] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Når profilen er venue manager: hent venues med _bookings=true så vi kan vise kommende bookinger
  useEffect(() => {
    if (!loading && profile?.venueManager && name) {
      ;(async () => {
        try {
          const res = await api.get<{ data: Venue[] }>(
            `/holidaze/profiles/${encodeURIComponent(
              name
            )}/venues?sort=created&limit=50&_bookings=true`
          )
          setVenues(res.data || [])
        } catch (e: unknown) {
          const msg =
            e instanceof Error ? e.message : 'Failed to load venues with bookings'
          toastError(msg)
        }
      })()
    }
  }, [loading, profile?.venueManager, name, setVenues, toastError])

  if (loading) {
    return (
      <section className="grid place-items-center py-16">
        <Spinner />
      </section>
    )
  }
  if (error) return <p className="text-red-600">{error}</p>
  if (!profile || !name) return <p>Profile not found.</p>

  const safeName = name as string

  async function refreshVenues() {
    try {
      const res = await api.get<{ data: Venue[] }>(
        `/holidaze/profiles/${encodeURIComponent(
          safeName
        )}/venues?sort=created&limit=50&_bookings=true`
      )
      setVenues(res.data || [])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to refresh venues'
      toastError(msg)
    }
  }

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      await api.post<{ data: { id: string } }>(`/holidaze/venues`, payload)
      setOpenCreate(false)
      await refreshVenues()
      toastSuccess('Venue created')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create venue'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(payload: VenuePayload) {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/holidaze/venues/${encodeURIComponent(editing.id)}`, payload)
      setEditing(null)
      await refreshVenues()
      toastSuccess('Venue updated')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update venue'
      toastError(msg)
    } finally {
      setSaving(false)
    }
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id)
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await api.delete(`/holidaze/venues/${encodeURIComponent(confirmDeleteId)}`)
      setVenues(prev => prev.filter(v => v.id !== confirmDeleteId))
      toastSuccess('Venue deleted')
      setConfirmDeleteId(null)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete venue'
      toastError(msg)
    } finally {
      setDeleting(false)
    }
  }

  // --- Upcoming bookings across my venues (for venue managers) ---
  const today0 = new Date()
  today0.setHours(0, 0, 0, 0)
  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

  const upcomingAcrossVenues: Array<
    BookingEx & { venueId: string; venueName: string }
  > = profile.venueManager
    ? (venues as VenueWithBookings[])
        .flatMap(v =>
          (v.bookings ?? [])
            .filter(b => new Date(b.dateTo).getTime() >= today0.getTime())
            .map(b => ({ ...b, venueId: v.id, venueName: v.name }))
        )
        .sort(
          (a, b) =>
            new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime()
        )
    : []

  return (
    <section className="py-6 sm:py-8 grid gap-6">
      {/* Header med banner + avatar */}
      <ProfileHeader profile={profile} />

      {/* Handlinger under header – grid på mobil, inline fra sm */}
      <div className="flex justify-center">
        <div className="mt-2 grid grid-cols-2 gap-2 sm:inline-flex sm:gap-3">
          {isSelf && (
            <button
              type="button"
              className="btn-solid rounded-full w-full sm:w-auto"
              onClick={() => setOpenEditProfile(true)}
            >
              Edit profile
            </button>
          )}
          {isSelf && profile.venueManager && (
            <button
              type="button"
              className="btn rounded-full w-full sm:w-auto"
              onClick={() => setOpenCreate(true)}
            >
              New venue
            </button>
          )}
        </div>
      </div>

      {/* To kort: My venues + Bookings */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold">My venues</h2>
          </div>
          <div className="p-3 sm:p-4">
            {profile.venueManager ? (
              <ProfileVenuesList
                venues={venues}
                canEdit={isSelf}
                onEdit={setEditing}
                onDelete={requestDelete}
                onCreateClick={() => setOpenCreate(true)}
              />
            ) : (
              <p className="text-gray-600">You’re not a Venue Manager.</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b">
            <h2 className="text-base sm:text-lg font-semibold">Upcoming bookings</h2>
          </div>
          <div className="p-3 sm:p-4">
            {profile.venueManager && isSelf ? (
              upcomingAcrossVenues.length ? (
                <ul className="divide-y">
                  {upcomingAcrossVenues.slice(0, 12).map(b => {
                    const d1 = new Date(b.dateFrom)
                    const d2 = new Date(b.dateTo)
                    return (
                      <li key={b.id} className="p-3 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {d1.toLocaleDateString(undefined, fmt)} → {d2.toLocaleDateString(undefined, fmt)}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {b.guests} guest{(b.guests || 1) === 1 ? '' : 's'}
                            {b.customer?.name ? <> · {b.customer.name}</> : null}
                            {' · '}
                            <span className="truncate">{b.venueName}</span>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-gray-600">No upcoming bookings.</p>
              )
            ) : (
              <ProfileBookings bookings={bookings} />
            )}
          </div>
        </div>
      </div>

      {/* Create venue modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create venue">
        <VenueForm submitting={saving} onSubmit={handleCreate} />
      </Modal>

      {/* Edit venue modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit venue">
        {editing && <VenueForm initial={editing} submitting={saving} onSubmit={handleEdit} />}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!confirmDeleteId}
        onClose={() => (deleting ? null : setConfirmDeleteId(null))}
        title="Delete venue?"
      >
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this venue? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-solid bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              onClick={confirmDelete}
              disabled={deleting}
              aria-busy={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit profile (avatar) modal */}
      <EditAvatarModal
        open={openEditProfile}
        onClose={() => setOpenEditProfile(false)}
        name={safeName}
        profile={profile}
        onUpdated={(p: TProfile) => setProfile(p)}
      />
    </section>
  )
}
