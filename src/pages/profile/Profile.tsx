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

/**
 * Profile page
 * - Loads profile, venues and bookings via `useProfileData(name)`.
 * - If viewing own profile (`isSelf`): can edit avatar, create/edit/delete venues.
 * - Shows upcoming bookings:
 *   - For venue managers viewing their own profile: aggregates across owned venues.
 *   - Otherwise: shows the user's own bookings (`ProfileBookings`).
 */
export default function Profile() {
  const { name } = useParams<RouteParams>()
  const { user, patchUser } = useAuth()
  const { profile, bookings, venues, setVenues, loading, error, setProfile } = useProfileData(name)
  const { success: toastSuccess, error: toastError } = useToast()

  const isSelf =
    !!(user?.name && name) && user.name.toLowerCase() === name.toLowerCase()

  // Modals
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)
  const [openEditProfile, setOpenEditProfile] = useState(false)

  // Delete flow
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
  if (profile?.name) {
    document.title = `Holidaze | ${profile.name}`
  } else {
    document.title = "Holidaze | Profile"
  }
}, [profile?.name])


  // When the profile is a venue manager: fetch venues with `_bookings=true` for upcoming list
  useEffect(() => {
    if (!loading && profile?.venueManager && name) {
      ;(async () => {
        try {
          const res = await api.get<{ data: Venue[] }>(
            `/holidaze/profiles/${encodeURIComponent(name)}/venues?sort=created&limit=50&_bookings=true`
          )
          setVenues(res.data || [])
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Failed to load venues with bookings'
          toastError(msg)
        }
      })()
    }
  }, [loading, profile?.venueManager, name, setVenues, toastError])

  if (loading) {
    return (
      <section className="grid place-items-center py-16" aria-busy="true" aria-live="polite">
        <Spinner />
      </section>
    )
  }
  if (error) {
    return (
      <p className="text-red-600" role="alert" aria-live="polite">
        {error}
      </p>
    )
  }
  if (!profile || !name) return <p>Profile not found.</p>

  const safeName = name

  

  // ---- helpers --------------------------------------------------------------

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
  const today0 = new Date(); today0.setHours(0, 0, 0, 0)
  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

  const upcomingAcrossVenues: Array<BookingEx & { venueId: string; venueName: string }> =
    profile.venueManager
      ? (venues as VenueWithBookings[])
          .flatMap(v =>
            (v.bookings ?? [])
              .filter(b => new Date(b.dateTo).getTime() >= today0.getTime())
              .map(b => ({ ...b, venueId: v.id, venueName: v.name }))
          )
          .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
      : []

  // ---- render ---------------------------------------------------------------

  return (
    <section className="grid gap-6 py-6 sm:py-8">
      {/* Header with banner + avatar */}
      <ProfileHeader profile={profile} />

      {/* Actions under header – grid on mobile, inline on ≥sm */}
      <div className="flex justify-center">
        <div className="mt-2 grid grid-cols-2 gap-2 sm:inline-flex sm:gap-3">
          {isSelf && (
            <button
              type="button"
              className="w-full rounded-full border border-holi-nav bg-holi-nav px-4 py-2 text-sm font-normal text-white hover:bg-holi-nav/90 sm:w-auto"
              onClick={() => setOpenEditProfile(true)}
            >
              Edit profile
            </button>
          )}
          {isSelf && profile.venueManager && (
            <button
              type="button"
              className="btn w-full rounded-full sm:w-auto"
              onClick={() => setOpenCreate(true)}
            >
              New venue
            </button>
          )}
        </div>
      </div>

      {/* Two cards: My venues + Bookings */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* My venues */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-base font-semibold sm:text-lg">My venues</h2>
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

        {/* Bookings */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <div className="border-b px-4 py-3 sm:px-5 sm:py-4">
            <h2 className="text-base font-semibold sm:text-lg">Upcoming bookings</h2>
          </div>
          <div className="p-3 sm:p-4">
            {profile.venueManager && isSelf ? (
              upcomingAcrossVenues.length ? (
                <ul className="divide-y">
                  {upcomingAcrossVenues.slice(0, 12).map(b => {
                    const d1 = new Date(b.dateFrom)
                    const d2 = new Date(b.dateTo)
                    return (
                      <li key={b.id} className="flex items-center justify-between gap-4 p-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {d1.toLocaleDateString(undefined, fmt)} → {d2.toLocaleDateString(undefined, fmt)}
                          </p>
                          <p className="truncate text-sm text-gray-600">
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
      <Modal
        open={openCreate}
        onClose={saving ? () => {} : () => setOpenCreate(false)}
        title="Create venue"
      >
        <VenueForm submitting={saving} onSubmit={handleCreate} />
      </Modal>

      {/* Edit venue modal */}
      <Modal
        open={!!editing}
        onClose={saving ? () => {} : () => setEditing(null)}
        title="Edit venue"
      >
        {editing && <VenueForm initial={editing} submitting={saving} onSubmit={handleEdit} />}
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!confirmDeleteId}
        onClose={deleting ? () => {} : () => setConfirmDeleteId(null)}
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
              className="btn-danger"
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
        onUpdated={(p: TProfile) => {
          setProfile(p)
          if (isSelf) {
            // keep the global auth user in sync so the header avatar updates instantly
            patchUser({ avatar: p.avatar, banner: p.banner })
          }
        }}
      />
    </section>
  )
}
