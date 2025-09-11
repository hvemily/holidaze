// src/pages/profile/Profile.tsx
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { api } from '@/utils/api'
import type { Venue, Profile as TProfile } from '@/utils/types'
import Modal from '@/components/Modal'
import VenueForm, { type VenuePayload } from '@/pages/manager/VenueForm'
import { useProfileData } from '@/hooks/useProfileData'
import ProfileHeader from '../../components/ProfileHeader'
import ProfileForms from '../../components/ProfileForms'
import ProfileBookings from '@/components/ProfileBookings'
import ProfileVenuesList from '../../components/ProfileVenueList'

type RouteParams = { name: string }

export default function Profile() {
  const { name } = useParams<RouteParams>()
  const { user } = useAuth()
  const { profile, bookings, venues, setVenues, loading, error, setProfile } =
    useProfileData(name)
  const isSelf = useMemo(
    () =>
      user?.name && name
        ? user.name.toLowerCase() === name.toLowerCase()
        : false,
    [user, name]
  )

  // modaler
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)

  if (loading) return <p>Loading profile…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!profile || !name) return <p>Profile not found.</p>

  // Etter guarden vet vi at name er en string:
  const safeName = name as string

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      await api.post<{ data: { id: string } }>(`/holidaze/venues`, payload)
      setOpenCreate(false)
      // refresh own venues
      const res = await api.get<{ data: Venue[] }>(
        `/holidaze/profiles/${encodeURIComponent(
          safeName
        )}/venues?sort=created&limit=50`
      )
      setVenues(res.data || [])
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(payload: VenuePayload) {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(
        `/holidaze/venues/${encodeURIComponent(editing.id)}`,
        payload
      )
      setEditing(null)
      const res = await api.get<{ data: Venue[] }>(
        `/holidaze/profiles/${encodeURIComponent(
          safeName
        )}/venues?sort=created&limit=50`
      )
      setVenues(res.data || [])
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this venue? This cannot be undone.')) return
    await api.delete(`/holidaze/venues/${encodeURIComponent(id)}`)
    setVenues((prev) => prev.filter((v) => v.id !== id))
  }

  return (
    <section className="grid gap-6">
      <ProfileHeader profile={profile} />

      {isSelf && (
        <ProfileForms
          name={safeName}
          profile={profile}
          onUpdated={(p: TProfile) => setProfile(p)}
        />
      )}

      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Upcoming bookings</h2>
        <ProfileBookings bookings={bookings} />
      </section>

      {profile.venueManager && (
        <ProfileVenuesList
          venues={venues}
          canEdit={isSelf}
          onEdit={setEditing}
          onDelete={handleDelete}
          onCreateClick={() => setOpenCreate(true)}
        />
      )}

      {/* Create */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Create venue"
      >
        <VenueForm submitting={saving} onSubmit={handleCreate} />
      </Modal>

      {/* Edit */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit venue"
      >
        {editing && (
          <VenueForm
            initial={editing}
            submitting={saving}
            onSubmit={handleEdit}
          />
        )}
      </Modal>
    </section>
  )
}
