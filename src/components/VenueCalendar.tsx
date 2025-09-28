// src/components/VenueCalendar.tsx
import Calendar, { type CalendarProps } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { useMemo } from 'react'

/** selected value type used by the app (mirrors react-calendar's Value). */
export type RangeValue = Date | [Date, Date] | null

/** minimal booking shape required for disabling dates. */
type Booking = {
  dateFrom: string
  dateTo: string
}

type Props = {
  /** existing bookings to disable (inclusive range). */
  bookings: Booking[]
  /** current selected value. */
  value: RangeValue
  /** called when user changes the selection. */
  onChange: (value: RangeValue) => void
  /** minimum selectable date (defaults to today). */
  minDate?: Date
  /** optional extra classes passed to the calendar root. */
  className?: string
}

/** return a new Date set to local midnight. */
function toMidnight(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** check if date `d` is within inclusive [from, to] bounds (midnight-based). */
function inRange(d: Date, from?: Date, to?: Date) {
  if (!from || !to) return false
  const x = toMidnight(d).getTime()
  return x >= toMidnight(from).getTime() && x <= toMidnight(to).getTime()
}

/**
 * venueCalendar
 * - wraps `react-calendar` with disabled tiles for booked ranges.
 * - keeps API minimal: selectRange on, disables booked dates, mirrors Value.
 */
export default function VenueCalendar({
  bookings,
  value,
  onChange,
  minDate,
  className,
}: Props) {
  // pre-compute normalized booking ranges (from <= to; both at midnight).
  const ranges = useMemo(
    () =>
      (bookings ?? []).map((b) => {
        const a = toMidnight(new Date(b.dateFrom))
        const z = toMidnight(new Date(b.dateTo))
        // normalize in case API ever returns reversed bounds
        const from = a <= z ? a : z
        const to = a <= z ? z : a
        return { from, to }
      }),
    [bookings]
  )

  // fast predicate used by tileDisabled/tileClassName
  const isBooked = (d: Date) => ranges.some((r) => inRange(d, r.from, r.to))

  // calendarProps["onChange"] is: (value: Value, event: React.MouseEvent<HTMLButtonElement>) => void
  const handleChange: NonNullable<CalendarProps['onChange']> = (val) => {
    if (Array.isArray(val)) {
      const [a, b] = val
      // when both ends exist, pass a tuple; otherwise pass single or null
      if (a && b) onChange([a, b])
      else onChange(a ?? null)
    } else {
      onChange(val ?? null)
    }
  }

  // disable any booked date cells in month view
  const tileDisabled: NonNullable<CalendarProps['tileDisabled']> = ({ date, view }) => {
    if (view !== 'month') return false
    return isBooked(date)
  }

  // add a visual hint for booked dates in month view
  const tileClassName: NonNullable<CalendarProps['tileClassName']> = ({ date, view }) => {
    if (view === 'month' && isBooked(date)) return 'opacity-40 pointer-events-none'
    return undefined
  }

  // react-calendar expects Date | Date[] | null
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
      // small a11y nicety: announce updates politely
      aria-label="Venue availability calendar"
    />
  )
}
