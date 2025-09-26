import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/stores/auth'
import { api } from '@/utils/api'
import type { Venue, Booking } from '@/utils/types'
import Spinner from '@/components/Spinner'
import { useToast } from '@/components/Toast'

const toTs = (v?: string) => (v ? new Date(v).getTime() : 0)
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d }
const isUpcoming = (b: Booking) => new Date(b.dateTo).getTime() >= startOfToday().getTime()

type VenueWithBookings = Venue & { bookings?: Booking[] }
type BookingEx = Booking & { customer?: { name?: string } }

export default function ManagerDashboard() {
  const { user } = useAuth()
  const { error: toastError, success: toastSuccess } = useToast()
  const [venues, setVenues] = useState<VenueWithBookings[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

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

        // Hvis API støtter det, kan du også legge til &_customer=true
        const res = await api.get<{ data: VenueWithBookings[] }>(
          `/holidaze/profiles/${encodeURIComponent(ownerName)}/venues?limit=100&_bookings=true`
        )
        const list = (res.data || [])
          .slice()
          .sort((a, b) => toTs(b.created) - toTs(a.created))

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

  function toggleExpanded(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }

  // Samlet feed: kommende bookinger på tvers av alle venues (owner)
  const upcomingFeed = useMemo(() => {
    const items: Array<BookingEx & { venueId: string; venueName: string }> = []
    venues.forEach(v => {
      ((v.bookings as BookingEx[]) ?? [])
        .filter(isUpcoming)
        .forEach(b => items.push({ ...b, venueId: v.id, venueName: v.name }))
    })
    return items
      .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())
  }, [venues])

  if (loading) {
    return (
      <section className="grid place-items-center py-16">
        <Spinner />
      </section>
    )
  }

  if (err) return <p className="text-red-600">{err}</p>

  return (
    <section className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Manage venues</h1>
        <Link
          to="/manager/venues/new"
          className="rounded-lg bg-black text-white px-4 py-2"
        >
          New venue
        </Link>
      </div>

      {/* Samlet kommende bookinger på tvers av venues */}
      <section className="rounded-2xl border bg-white shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">
            Upcoming bookings across your venues
          </h2>
          <p className="text-sm text-gray-600">
            {upcomingFeed.length > 0
              ? `${upcomingFeed.length} upcoming booking${upcomingFeed.length === 1 ? '' : 's'}`
              : 'No upcoming bookings yet.'}
          </p>
        </div>

        {upcomingFeed.length > 0 && (
          <ul className="divide-y">
            {upcomingFeed.slice(0, 12).map(b => {
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
                      <Link
                        className="underline underline-offset-2"
                        to={`/venues/${b.venueId}`}
                        title="Open venue"
                      >
                        {b.venueName}
                      </Link>
                    </p>
                  </div>
                  <Link
                    to={`/venues/${b.venueId}`}
                    className="shrink-0 rounded-lg border px-3 py-1 text-sm"
                    title="View venue"
                  >
                    View
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {venues.length === 0 ? (
        <p className="text-gray-600">
          You have no venues yet. Create your first one!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map(v => {
            const img =
              v.media?.[0]?.url || 'https://picsum.photos/seed/manager/640/480'

            const upcoming = ((v.bookings as BookingEx[]) ?? [])
              .filter(isUpcoming)
              .slice()
              .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())

            const next = upcoming[0]
            const nextLabel = next
              ? `${new Date(next.dateFrom).toLocaleDateString(undefined, fmt)} → ${new Date(next.dateTo).toLocaleDateString(undefined, fmt)} · ${next.guests} guest${(next.guests||1) === 1 ? '' : 's'}`
              : null

            const isOpen = expanded.has(v.id)

            return (
              <article
                key={v.id}
                className="rounded-2xl overflow-hidden bg-white shadow border flex flex-col"
              >
                <img
                  src={img}
                  alt={v.media?.[0]?.alt || v.name}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4 grid gap-2 flex-1">
                  <h3 className="font-semibold line-clamp-1">{v.name}</h3>
                  <div className="text-sm text-gray-600">
                    ${v.price} /night · Max {v.maxGuests ?? 1}
                  </div>

                  <div className="text-xs rounded-lg border px-3 py-2 bg-gray-50">
                    <span className="font-medium">Bookings: </span>
                    {nextLabel
                      ? <>Next: {nextLabel} ({upcoming.length} upcoming)</>
                      : <span className="text-gray-600">No upcoming bookings</span>}
                  </div>

                  {upcoming.length > 0 && (
                    <div className="mt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(v.id)}
                        className="text-sm underline underline-offset-2"
                        aria-expanded={isOpen}
                        aria-controls={`venue-${v.id}-bookings`}
                      >
                        {isOpen ? 'Hide bookings' : 'Show bookings'}
                      </button>

                      {isOpen && (
                        <ul
                          id={`venue-${v.id}-bookings`}
                          className="mt-2 rounded-lg border bg-white divide-y"
                        >
                          {upcoming.slice(0, 5).map(b => {
                            const d1 = new Date(b.dateFrom)
                            const d2 = new Date(b.dateTo)
                            return (
                              <li key={b.id} className="p-2 text-sm flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium truncate">
                                    {d1.toLocaleDateString(undefined, fmt)} → {d2.toLocaleDateString(undefined, fmt)}
                                  </p>
                                  <p className="text-gray-600 truncate">
                                    {b.guests} guest{(b.guests || 1) === 1 ? '' : 's'}
                                    {(b as BookingEx).customer?.name ? <> · {(b as BookingEx).customer!.name}</> : null}
                                  </p>
                                </div>
                                <Link
                                  to={`/venues/${v.id}`}
                                  className="shrink-0 rounded border px-2 py-1"
                                  title="Open venue"
                                >
                                  View
                                </Link>
                              </li>
                            )
                          })}
                          {upcoming.length > 5 && (
                            <li className="p-2 text-xs text-gray-600">
                              + {upcoming.length - 5} more…
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1 mt-auto">
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
                    <button
                      type="button"
                      onClick={() => onDelete(v.id)}
                      disabled={deletingId === v.id}
                      aria-busy={deletingId === v.id}
                      className="btn-danger text-sm px-3 py-1 disabled:opacity-50"
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
