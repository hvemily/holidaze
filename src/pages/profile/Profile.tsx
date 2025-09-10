// src/pages/profile/Profile.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../stores/auth'
import { api } from '../../utils/api'
import type { Booking, Venue, Profile as TProfile } from '../../utils/types'
import Modal from '../../components/Modal'
import VenueForm, { type VenuePayload } from '../manager/VenueForm'

type ProfileResponse = { data: TProfile }
type BookingsResponse = { data: Booking[] }
type VenuesResponse = { data: Venue[] }

const FALLBACK_BANNER =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1600&auto=format&fit=crop'
const FALLBACK_AVATAR = 'https://i.pravatar.cc/100?u=holidaze'

export default function Profile() {
  const { name } = useParams()
  const { user } = useAuth()

  const isSelf = useMemo(
    () => user?.name?.toLowerCase() === name?.toLowerCase(),
    [user, name]
  )

  const [profile, setProfile] = useState<TProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // forms
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  // modals
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Venue | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      if (!name) return
      try {
        setLoading(true)
        setErr(null)

        const p = await api.get<ProfileResponse>(
          `/holidaze/profiles/${encodeURIComponent(name)}`
        )
        if (ignore) return
        setProfile(p.data)
        setAvatarUrl(p.data?.avatar?.url || '')
        setBannerUrl(p.data?.banner?.url || '')

        const b = await api.get<BookingsResponse>(
          `/holidaze/profiles/${encodeURIComponent(
            name
          )}/bookings?upcoming=true&_owner=true&_venue=true&sort=dateFrom`
        )
        if (ignore) return
        setBookings(b.data || [])

        if (p.data?.venueManager) {
          await loadVenues(name, setVenues)
        }
      } catch (e: any) {
        if (!ignore) setErr(e.message || 'Failed to load profile')
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => { ignore = true }
  }, [name])

  async function loadVenues(ownerName: string, set: (v: Venue[]) => void) {
    const v = await api.get<VenuesResponse>(
      `/holidaze/profiles/${encodeURIComponent(ownerName)}/venues?sort=created&limit=50`
    )
    set(v.data || [])
  }

  async function updateAvatar(e: React.FormEvent) {
    e.preventDefault()
    if (!isSelf || !name) return
    try {
      setErr(null)
      await api.put<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}/media`,
        { avatar: { url: avatarUrl, alt: `${name}'s avatar` } }
      )
      const p = await api.get<ProfileResponse>(
        `/holidaze/profiles/${encodeURIComponent(name)}`
      )
      setProfile(p.data)
      alert('Avatar updated')
    } catch (e: any) {
      setErr(e.message || 'Failed to update avatar')
    }
  }

  async function updateBanner(e: React.FormEvent) {
    e.preventDefault()
    if (!isSelf || !name) return
    try {
      setErr(null)
      await api.put<{ data: TProfile }>(
        `/holidaze/profiles/${encodeURIComponent(name)}/media`,
        { banner: { url: bannerUrl, alt: `${name}'s header` } }
      )
      const p = await api.get<ProfileResponse>(
        `/holidaze/profiles/${encodeURIComponent(name)}`
      )
      setProfile(p.data)
      alert('Header background updated')
    } catch (e: any) {
      setErr(e.message || 'Failed to update header')
    }
  }

  async function handleCreate(payload: VenuePayload) {
    setSaving(true)
    try {
      const res = await api.post<{ data: { id: string } }>(
        `/holidaze/venues`,
        payload
      )
      setOpenCreate(false)
      // refresh list
      if (name) await loadVenues(name, setVenues)
      // valgfritt: redirect til den nye siden
      // nav(`/venues/${res.data.id}`)
    } catch (e: any) {
      alert(e.message || 'Failed to create venue')
    } finally {
      setSaving(false)
    }
  }

  async function handleEdit(payload: VenuePayload) {
    if (!editing) return
    setSaving(true)
    try {
      await api.put(`/holidaze/venues/${editing.id}`, payload)
      setEditing(null)
      if (name) await loadVenues(name, setVenues)
    } catch (e: any) {
      alert(e.message || 'Failed to update venue')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this venue? This cannot be undone.')) return
    await api.delete(`/holidaze/venues/${id}`)
    setVenues(prev => prev.filter(v => v.id !== id))
  }

  if (loading) return <p>Loading profile…</p>
  if (err) return <p className="text-red-600">{err}</p>
  if (!profile) return <p>Profile not found.</p>

  const bannerSrc = profile.banner?.url || FALLBACK_BANNER
  const avatarSrc = profile.avatar?.url || FALLBACK_AVATAR

  return (
    <section className="grid gap-6">
      {/* Header */}
      <div className="relative">
        <div className="h-40 w-full rounded-xl overflow-hidden">
          <img src={bannerSrc} alt={profile.banner?.alt || `${profile.name}'s header`} className="w-full h-full object-cover" />
        </div>
        <div className="-mt-10 flex items-center gap-4 px-2">
          <img src={avatarSrc} alt={profile.avatar?.alt || profile.name} className="h-20 w-20 rounded-full object-cover border-4 border-white shadow" />
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <div className="text-sm text-gray-600">{profile.email}</div>
            {profile.venueManager ? (
              <span className="inline-block mt-1 rounded-full border px-2 py-0.5 text-xs">Venue Manager</span>
            ) : (
              <span className="inline-block mt-1 rounded-full border px-2 py-0.5 text-xs">Customer</span>
            )}
          </div>
        </div>
      </div>

      {/* Forms for owner */}
      {isSelf && (
        <div className="grid gap-6 max-w-lg">
          <form onSubmit={updateAvatar} className="grid gap-2">
            <label className="text-sm font-medium">Avatar URL</label>
            <input value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} className="rounded-lg border px-3 py-2" placeholder="https://…" />
            <button className="rounded-lg bg-black text-white px-4 py-2 w-fit">Update avatar</button>
            <p className="text-xs text-gray-500">Tip: bruk et bilde som er minst 256×256 for skarp avatar.</p>
          </form>

          <form onSubmit={updateBanner} className="grid gap-2">
            <label className="text-sm font-medium">Header background URL</label>
            <input value={bannerUrl} onChange={(e)=>setBannerUrl(e.target.value)} className="rounded-lg border px-3 py-2" placeholder="https://…" />
            <button className="rounded-lg bg-black text-white px-4 py-2 w-fit">Update header</button>
            <p className="text-xs text-gray-500">Vises øverst på profilen din.</p>
          </form>
        </div>
      )}

      {/* Bookings */}
      <section className="grid gap-3">
        <h2 className="text-xl font-semibold">Upcoming bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-gray-600">No upcoming bookings.</p>
        ) : (
          <div className="grid gap-3">
            {bookings.map((b) => (
              <article key={b.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">
                    {b.venue?.name || 'Venue'} · {formatDateRange(b.dateFrom, b.dateTo)}
                  </div>
                  <Link to={`/venues/${b.venue?.id || ''}`} className="text-sm underline">View</Link>
                </div>
                <div className="text-sm text-gray-600">
                  Guests: {b.guests}{' '}
                  {b.venue?.location?.city ? `· ${b.venue.location.city}` : ''}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Venues for managers */}
      {profile.venueManager && (
        <section className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Your venues</h2>
            {isSelf && (
              <button
                onClick={() => setOpenCreate(true)}
                className="rounded-lg bg-blue-600 text-white px-4 py-2"
              >
                Create venue
              </button>
            )}
          </div>

          {venues.length === 0 ? (
            <p className="text-gray-600">
              You haven’t created any venues yet.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((v) => {
                const img = v.media?.[0]?.url || 'https://picsum.photos/seed/venue/640/480'
                return (
                  <article key={v.id} className="rounded-2xl overflow-hidden bg-white shadow border">
                    <img src={img} alt={v.media?.[0]?.alt || v.name} className="h-40 w-full object-cover" />
                    <div className="p-4 grid gap-2">
                      <h3 className="font-semibold line-clamp-1">{v.name}</h3>
                      <div className="text-sm text-gray-600">${v.price} /night</div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/venues/${v.id}`} className="rounded-lg border px-3 py-1 text-sm">
                          View
                        </Link>
                        {isSelf && (
                          <>
                            <button
                              onClick={() => setEditing(v)}
                              className="rounded-lg border px-3 py-1 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(v.id)}
                              className="rounded-lg border px-3 py-1 text-sm text-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}

      {/* Create modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title="Create venue">
        <VenueForm submitting={saving} onSubmit={handleCreate} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit venue">
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

function formatDateRange(from: string, to: string) {
  const f = new Date(from)
  const t = new Date(to)
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
  return `${f.toLocaleDateString(undefined, opts)} → ${t.toLocaleDateString(undefined, opts)}`
}
