// src/components/VenueCalendar.tsx
import { useMemo, useState } from 'react'
import type { Booking } from '@/utils/types'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

type RangeValue = Date | [Date, Date] | null

const EXCLUSIVE_END = true // true = blokker t.o.m. dagen før dateTo

function atMidnight(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function* eachDay(start: Date, end: Date) {
  const cur = atMidnight(start)
  const last = atMidnight(end)
  while (cur <= last) {
    yield new Date(cur)
    cur.setDate(cur.getDate() + 1)
  }
}

export default function VenueCalendar({
  bookings,
  onChange,
  value,
  minDate,
}: {
  bookings: Booking[]
  value?: RangeValue
  onChange?: (val: RangeValue) => void
  minDate?: Date
}) {
  // Lag et raskt oppslagssett for blokkerte datoer
  const blocked = useMemo(() => {
    const s = new Set<number>()
    for (const b of bookings) {
      const start = atMidnight(new Date(b.dateFrom))
      const rawEnd = atMidnight(new Date(b.dateTo))
      const end = EXCLUSIVE_END ? new Date(rawEnd.getTime() - 24 * 60 * 60 * 1000) : rawEnd
      for (const d of eachDay(start, end)) {
        s.add(d.getTime())
      }
    }
    return s
  }, [bookings])

  // Hjelper: er en dato blokkert?
  function isBlocked(date: Date) {
    const t = atMidnight(date).getTime()
    return blocked.has(t)
  }

  // Ekstra: marker bookede dager visuelt
  function tileClassName({ date, view }: { date: Date; view: string }) {
    if (view === 'month' && isBlocked(date)) return 'react-calendar__tile--blocked'
    return undefined
  }

  // Deaktiver klikking på bookede dager og tidligere dager
  function tileDisabled({ date }: { date: Date }) {
    const beforeToday = atMidnight(date) < atMidnight(new Date())
    return beforeToday || isBlocked(date)
  }

  // Hvis bruker velger et intervall som inkluderer blokkerte dager — nullstill
  const [badRange, setBadRange] = useState<string | null>(null)
  function handleChange(next: RangeValue) {
    setBadRange(null)
    if (Array.isArray(next) && next[0] && next[1]) {
      const start = atMidnight(next[0])
      const end = atMidnight(next[1])
      for (const d of eachDay(start, end)) {
        if (isBlocked(d)) {
          setBadRange('Selected range overlaps an unavailable date.')
          // Ikke kall onChange i dette tilfellet
          return
        }
      }
    }
    onChange?.(next)
  }

  return (
    <div className="grid gap-2">
      <Calendar
        selectRange
        value={value ?? null}
        onChange={handleChange}
        minDate={minDate ?? new Date()}
        tileDisabled={tileDisabled}
        tileClassName={tileClassName}
      />
      {badRange && <p className="text-sm text-red-600">{badRange}</p>}
      {/* Små styles for blocked state (du kan flytte til CSS) */}
      <style>{`
        .react-calendar__tile--blocked {
          background: #f1f5f9 !important;
          color: #9ca3af !important;
          text-decoration: line-through;
          cursor: not-allowed !important;
        }
      `}</style>
    </div>
  )
}
