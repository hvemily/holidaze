// src/components/VenueFilters.tsx
import { useId } from 'react'

type Props = {
  q: string
  onQChange: (v: string) => void
  checkIn?: string
  onCheckInChange: (v: string) => void
  checkOut?: string
  onCheckOutChange: (v: string) => void
  guests: number
  onGuestsChange: (v: number) => void
  onSubmit?: () => void
  busy?: boolean
}

/**
 * Compact search/filter bar for venue listings.
 * - "Where" (free text), Check-in/out dates, "Who" (guest count) and a Search button.
 * - Desktop: all fields inline; Mobile: dates move below as a separate row.
 * - Emits changes via controlled props, and calls `onSubmit` on form submit.
 */
export default function VenueFilters({
  q, onQChange,
  checkIn, onCheckInChange,
  checkOut, onCheckOutChange,
  guests, onGuestsChange,
  onSubmit, busy,
}: Props) {
  const whereId = useId()
  const inId = useId()
  const outId = useId()
  const whoId = useId()

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit?.() }}
      role="search"
      aria-label="Search and filter venues"
      aria-busy={!!busy}
      className="mx-auto w-full max-w-4xl"
    >
      <div className="flex items-stretch gap-0 overflow-hidden rounded-full border border-gray-300 bg-white shadow-sm">
        {/* Where */}
        <div className="flex-1 px-4 py-2.5">
          <label htmlFor={whereId} className="block text-[11px] uppercase tracking-wide text-gray-500">
            Where
          </label>
          <input
            id={whereId}
            type="text"
            placeholder="Search for title or ID of venue"
            className="w-full bg-transparent text-sm outline-none"
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            autoComplete="off"
            inputMode="search"
            spellCheck={false}
          />
        </div>

        {/* Divider */}
        <div className="hidden w-px self-stretch bg-gray-200 md:block" />

        {/* Check-in (desktop) */}
        <div className="hidden px-4 py-2.5 md:block">
          <label htmlFor={inId} className="block text-[11px] uppercase tracking-wide text-gray-500">
            Check-in
          </label>
          <input
            id={inId}
            type="date"
            className="bg-transparent text-sm outline-none"
            value={checkIn || ''}
            onChange={(e) => onCheckInChange(e.target.value)}
            min={today}
          />
        </div>

        {/* Divider */}
        <div className="hidden w-px self-stretch bg-gray-200 md:block" />

        {/* Check-out (desktop) */}
        <div className="hidden px-4 py-2.5 md:block">
          <label htmlFor={outId} className="block text-[11px] uppercase tracking-wide text-gray-500">
            Check-out
          </label>
          <input
            id={outId}
            type="date"
            className="bg-transparent text-sm outline-none"
            value={checkOut || ''}
            onChange={(e) => onCheckOutChange(e.target.value)}
            min={checkIn || today}
          />
        </div>

        {/* Divider */}
        <div className="hidden w-px self-stretch bg-gray-200 md:block" />

        {/* Who */}
        <div className="px-4 py-2.5">
          <label htmlFor={whoId} className="block text-[11px] uppercase tracking-wide text-gray-500">
            Who
          </label>
          <input
            id={whoId}
            type="number"
            min={1}
            step={1}
            className="w-20 bg-transparent text-sm outline-none"
            value={guests}
            onChange={(e) => onGuestsChange(Math.max(1, Number(e.target.value) || 1))}
            inputMode="numeric"
            pattern="[0-9]*"
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={busy}
          className="m-1 ml-auto rounded-full bg-[#1B5071] px-5 text-sm font-medium text-white transition hover:bg-[#1B5071]/90 disabled:cursor-not-allowed disabled:opacity-60 md:px-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5285A5]"
        >
          Search
        </button>
      </div>

      {/* Mobile-only date row */}
      <div className="mt-2 grid gap-2 md:hidden">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border px-3 py-2">
            <label htmlFor={`${inId}-m`} className="block text-[11px] uppercase tracking-wide text-gray-500">
              Check-in
            </label>
            <input
              id={`${inId}-m`}
              type="date"
              className="w-full bg-transparent text-sm outline-none"
              value={checkIn || ''}
              onChange={(e) => onCheckInChange(e.target.value)}
              min={today}
            />
          </div>

          <div className="flex-1 rounded-xl border px-3 py-2">
            <label htmlFor={`${outId}-m`} className="block text-[11px] uppercase tracking-wide text-gray-500">
              Check-out
            </label>
            <input
              id={`${outId}-m`}
              type="date"
              className="w-full bg-transparent text-sm outline-none"
              value={checkOut || ''}
              onChange={(e) => onCheckOutChange(e.target.value)}
              min={checkIn || today}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
