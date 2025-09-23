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

  return (
    <form
      onSubmit={(e)=>{ e.preventDefault(); onSubmit?.() }}
      role="search"
      aria-label="Search and filter venues"
      className="mx-auto w-full max-w-4xl"
    >
      <div className="flex items-stretch gap-0 overflow-hidden rounded-full border border-gray-300 bg-white shadow-sm">
        {/* Where */}
        <div className="flex-1 px-4 py-2.5">
          <label htmlFor={whereId} className="block text-[11px] uppercase tracking-wide text-gray-500">Where</label>
          <input
            id={whereId}
            type="text"
            placeholder="Search for title or ID of venue"
            className="w-full bg-transparent outline-none text-sm"
            value={q}
            onChange={(e)=>onQChange(e.target.value)}
            autoComplete="off"
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch bg-gray-200" />

        {/* Check-in */}
        <div className="hidden md:block px-4 py-2.5">
          <label htmlFor={inId} className="block text-[11px] uppercase tracking-wide text-gray-500">Check-in</label>
          <input
            id={inId}
            type="date"
            className="bg-transparent outline-none text-sm"
            value={checkIn || ''}
            onChange={(e)=>onCheckInChange(e.target.value)}
            min={new Date().toISOString().slice(0,10)}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch bg-gray-200" />

        {/* Check-out */}
        <div className="hidden md:block px-4 py-2.5">
          <label htmlFor={outId} className="block text-[11px] uppercase tracking-wide text-gray-500">Check-out</label>
          <input
            id={outId}
            type="date"
            className="bg-transparent outline-none text-sm"
            value={checkOut || ''}
            onChange={(e)=>onCheckOutChange(e.target.value)}
            min={checkIn || new Date().toISOString().slice(0,10)}
          />
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px self-stretch bg-gray-200" />

        {/* Who */}
        <div className="px-4 py-2.5">
          <label htmlFor={whoId} className="block text-[11px] uppercase tracking-wide text-gray-500">Who</label>
          <input
            id={whoId}
            type="number"
            min={1}
            className="w-20 bg-transparent outline-none text-sm"
            value={guests}
            onChange={(e)=>onGuestsChange(Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        {/* Search button */}
        <button
          type="submit"
          disabled={busy}
          className="ml-auto rounded-full bg-blue-600 text-white text-sm font-medium px-5 md:px-6 m-1 disabled:opacity-60"
        >
          Search
        </button>
      </div>

      {/* Mobile-only date row */}
      <div className="mt-2 grid gap-2 md:hidden">
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border px-3 py-2">
            <label htmlFor={`${inId}-m`} className="block text-[11px] uppercase tracking-wide text-gray-500">Check-in</label>
            <input
              id={`${inId}-m`}
              type="date"
              className="w-full bg-transparent outline-none text-sm"
              value={checkIn || ''}
              onChange={(e)=>onCheckInChange(e.target.value)}
              min={new Date().toISOString().slice(0,10)}
            />
          </div>
          <div className="flex-1 rounded-xl border px-3 py-2">
            <label htmlFor={`${outId}-m`} className="block text-[11px] uppercase tracking-wide text-gray-500">Check-out</label>
            <input
              id={`${outId}-m`}
              type="date"
              className="w-full bg-transparent outline-none text-sm"
              value={checkOut || ''}
              onChange={(e)=>onCheckOutChange(e.target.value)}
              min={checkIn || new Date().toISOString().slice(0,10)}
            />
          </div>
        </div>
      </div>
    </form>
  )
}
