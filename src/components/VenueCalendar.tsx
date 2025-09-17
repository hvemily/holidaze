// src/components/VenueCalendar.tsx
import Calendar, { type CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useMemo } from 'react'

// Din app-type
export type RangeValue = Date | [Date, Date] | null

// En enkel booking-type (tilpass om du har en egen)
type Booking = {
  dateFrom: string
  dateTo: string
}

type Props = {
  bookings: Booking[]
  value: RangeValue
  onChange: (value: RangeValue) => void
  minDate?: Date
  className?: string
}

function toMidnight(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function inRange(d: Date, from?: Date, to?: Date) {
  if (!from || !to) return false
  const x = toMidnight(d).getTime()
  return x >= toMidnight(from).getTime() && x <= toMidnight(to).getTime()
}

export default function VenueCalendar({
  bookings,
  value,
  onChange,
  minDate,
  className,
}: Props) {
  // Precompute booking-ranger
  const ranges = useMemo(() => {
    return (bookings ?? []).map(b => ({
      from: toMidnight(new Date(b.dateFrom)),
      to: toMidnight(new Date(b.dateTo)),
    }))
  }, [bookings])

  const isBooked = (d: Date) => ranges.some(r => inRange(d, r.from, r.to))

  // ---- Viktig: bruk nøyaktig samme signatur som react-calendar ----
  // CalendarProps["onChange"] er: (value: Value, event: React.MouseEvent<HTMLButtonElement>) => void
const handleChange: NonNullable<CalendarProps['onChange']> = (val) => {
  if (Array.isArray(val)) {
    const [a, b] = val
    if (a && b) onChange([a, b])
    else onChange(a ?? null)
  } else {
    onChange(val ?? null)
  }
}

  const tileDisabled: NonNullable<CalendarProps['tileDisabled']> = ({ date, view }) => {
    if (view !== 'month') return false
    return isBooked(date)
  }

  const tileClassName: NonNullable<CalendarProps['tileClassName']> = ({ date, view }) => {
    if (view === 'month' && isBooked(date)) return 'opacity-40 pointer-events-none'
    return undefined
  }

  // react-calendar forventer Date | Date[] | null
  const calendarValue: CalendarProps['value'] =
    Array.isArray(value) ? (value as [Date, Date]) : value ?? null

  return (
    <Calendar
      selectRange
      value={calendarValue}
      onChange={handleChange}
      minDate={minDate ?? new Date()}
      tileDisabled={tileDisabled}
      tileClassName={tileClassName}
      className={className}
    />
  )
}
