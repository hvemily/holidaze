// src/pages/manager/ManagerDashboard.tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { api } from '@/utils/api'
import type { Venue } from '@/utils/types'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

const toTs = (v?: string) => (v ? new Date(v).getTime() : 0)

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        setLoading(true)
        setErr(null)

        const ownerName = user?.name
        if (!ownerName) {
          if (!ignore) {
            setVenues([])
            const msg = 'You must be logged in to manage venues.'
            setErr(msg)
            toastError(msg)
          }
          return
        }

        const res = await api.get<{ data: Venue[] }>(
          `/holidaze/profiles/${encodeURIComponent(ownerName)}/venues?limit=100`
        )
        const list = (res.data || []).slice().sort((a, b) => toTs(b.created) - toTs(a.created))

        if (!ignore) setVenues(list)
      } catch (e: unknown) {
        if (!ignore) {
          const msg = e instanceof Error ? e.message : 'Failed to load venues'
          setErr(msg)
          toastError(msg)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    })()
    return () => {
      ignore = true
    }
  }, [user?.name, toastError])

  async function onDelete(id: string) {
    setDeletingId(id)
    try {
      await api.delete(`/holidaze/venues/${encodeURIComponent(id)}`)
      setVenues(prev => prev.filter(v => v.id !== id))
      toastSuccess('Venue deleted')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete venue'
      setErr(msg)
      toastError(msg)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <section className="grid place-items-center py-16">
        <Spinner />
      </section>
    )
  }

  if (err) return <p className="text-red-600">{err}</p>

  return (
    <section className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage venues</h1>
        <Link
          to="/manager/venues/new"
          className="rounded-lg bg-black text-white px-4 py-2"
        >
          New venue
        </Link>
      </div>

      {venues.length === 0 ? (
        <p className="text-gray-600">
          You have no venues yet. Create your first one!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map(v => {
            const img =
              v.media?.[0]?.url || 'https://picsum.photos/seed/manager/640/480'
            return (
              <article
                key={v.id}
                className="rounded-2xl overflow-hidden bg-white shadow border"
              >
                <img
                  src={img}
                  alt={v.media?.[0]?.alt || v.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4 grid gap-2">
                  <h3 className="font-semibold line-clamp-1">{v.name}</h3>
                  <div className="text-sm text-gray-600">
                    ${v.price} /night · Max {v.maxGuests ?? 1}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/venues/${v.id}`}
                      className="rounded-lg border px-3 py-1 text-sm"
                    >
                      View
                    </Link>
                    <Link
                      to={`/manager/venues/${v.id}/edit`}
                      className="rounded-lg border px-3 py-1 text-sm"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/manager/venues/${v.id}/bookings`}
                      className="rounded-lg border px-3 py-1 text-sm"
                    >
                      Bookings
                    </Link>
                    <button
                      onClick={() => onDelete(v.id)}
                      disabled={deletingId === v.id}
                      aria-busy={deletingId === v.id}
                      className="rounded-lg border px-3 py-1 text-sm text-red-700 disabled:opacity-50"
                    >
                      {deletingId === v.id ? (
                        <span className="flex items-center gap-1">
                          <Spinner size="sm" /> Deleting…
                        </span>
                      ) : (
                        'Delete'
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
