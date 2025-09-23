// src/pages/profile/Profile.tsx
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { api } from '@/utils/api'
import type { Venue, Profile as TProfile } from '@/utils/types'
import Modal from '@/components/Modal'
import VenueForm, { type VenuePayload } from '@/pages/manager/VenueForm'
import { useProfileData } from '@/hooks/useProfileData'
import ProfileHeader from '@/components/ProfileHeader'
import ProfileForms from '@/components/ProfileForms'
import ProfileBookings from '@/components/ProfileBookings'
import ProfileVenuesList from '@/components/ProfileVenueList'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

type RouteParams = { name: string }

export default function Profile() {
  const { name } = useParams<RouteParams>()
  const { user } = useAuth()
  const { profile, bookings, venues, setVenues, loading, error, setProfile } =
    useProfileData(name)
  const { success: toastSuccess, error: toastError } = useToast()

  const isSelf = useMemo(
    () => (user?.name && name ? user.name.toLowerCase() === name.toLowerCase() : false),
    [user, name]
  )

  // Modals
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)

  // Delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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
        `/holidaze/profiles/${encodeURIComponent(safeName)}/venues?sort=created&limit=50`
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

  // Kalles fra liste-knapp: åpner bekreftelsesmodal
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

  return (
    <section className="grid gap-6 max-w-3xl mx-auto">
      <ProfileHeader profile={profile} />

      {/* Actions under the header */}
      <div className="flex justify-center gap-3 -mt-2">
        {isSelf && (
          <a
            href="#profile-edit"
            className="rounded-xl bg-gray-700 text-white px-4 py-2 text-sm shadow hover:bg-gray-800"
            onClick={(e) => {
              e.preventDefault()
              document.getElementById('profile-edit')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Edit profile
          </a>
        )}

        {isSelf && profile.venueManager && (
          <button
            type="button"
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm shadow hover:bg-blue-700"
            onClick={() => setOpenCreate(true)}
          >
            New venue
          </button>
        )}
      </div>

      {/* Forms (only for self) */}
      {isSelf && (
        <div id="profile-edit">
          <ProfileForms
            name={safeName}
            profile={profile}
            onUpdated={(p: TProfile) => setProfile(p)}
          />
        </div>
      )}

      {/* Bookings */}
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Upcoming bookings</h2>
        <ProfileBookings bookings={bookings} />
      </section>

      {/* Venues (visible if user is a manager) */}
      {profile.venueManager && (
        <ProfileVenuesList
          venues={venues}
          canEdit={isSelf}
          onEdit={setEditing}
          onDelete={requestDelete}   // 👈 erstatter confirm(...) med egen modal
          onCreateClick={() => setOpenCreate(true)}
        />
      )}

      {/* Create modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create venue">
        <VenueForm submitting={saving} onSubmit={handleCreate} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit venue">
        {editing && (
          <VenueForm initial={editing} submitting={saving} onSubmit={handleEdit} />
        )}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!confirmDeleteId} onClose={() => (deleting ? null : setConfirmDeleteId(null))} title="Delete venue?">
        <div className="grid gap-3">
          <p className="text-sm text-gray-700">
            Are you sure you want to delete this venue? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded border px-4 py-2 text-sm"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-red-600 text-white px-4 py-2 text-sm disabled:opacity-50"
              onClick={confirmDelete}
              disabled={deleting}
              aria-busy={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </section>
  )
}
