// src/components/RatingStars.tsx
import { useId } from 'react'
import clsx from 'clsx'

type Props = {
  /** rating value, supports decimals. Defaults to 0. */
  value?: number
  /** maximum possible rating (default 5). */
  outOf?: number
  /** whether to show numeric rating beside the stars. */
  showNumber?: boolean
  /** size of the star icons. */
  size?: 'sm' | 'md' | 'lg'
  /** pptional extra CSS classes for the wrapper. */
  className?: string
}

/**
 * renders a row of star icons with partial fills to represent ratings.
 *
 * - uses `<linearGradient>` with unique IDs for partial fill.
 * - accepts decimal ratings, rounded to 1 decimal.
 * - accessible: adds `aria-label` with the score.
 */
export default function RatingStars({
  value = 0,
  outOf = 5,
  showNumber = false,
  size = 'sm',
  className,
}: Props) {
  // clamp value between 0 and outOf, round to 1 decimal for stable rendering
  const clamped = Math.max(0, Math.min(outOf, Number(value) || 0))
  const rounded = Math.round(clamped * 10) / 10

  // tailwind size class per prop
  const sizeCls =
    size === 'lg' ? 'h-6 w-6' : size === 'md' ? 'h-5 w-5' : 'h-4 w-4'

  const uid = useId()

  /**
   * compute fill percentage for star index `i`.
   * example: if value=3.4 → star[0..2] = 100%, star[3] = 40%, star[4] = 0%.
   */
  const fillPct = (i: number) => {
    const s = rounded - i // how much of this star is filled
    const p = Math.max(0, Math.min(1, s)) // clamp 0..1
    return Math.round(p * 1000) / 10 // percentage with 1 decimal
  }

  /** star component with gradient fill. */
  const Star = ({ pct }: { pct: number }) => {
    const gradId = `${uid}-grad-${pct}`
    return (
      <svg
        viewBox="0 0 20 20"
        className={clsx(sizeCls)}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#facc15" />
            <stop offset={`${pct}%`} stopColor="#facc15" />
            <stop offset={`${pct}%`} stopColor="transparent" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* base (gray) */}
        <path
          fill="#d1d5db"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.698a1 1 0 00.95.69h3.887c.967 0 1.371 1.24.588 1.81l-3.146 2.286a1 1 0 00-.364 1.118l1.2 3.698c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.726 2.698c-.784.57-1.838-.197-1.539-1.118l1.2-3.698a1 1 0 00-.364-1.118L2.425 9.125c-.783-.57-.38-1.81.588-1.81h3.887a1 1 0 00.95-.69l1.2-3.698z"
        />
        {/* filled portion (yellow) */}
        <path
          fill={`url(#${gradId})`}
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.2 3.698a1 1 0 00.95.69h3.887c.967 0 1.371 1.24.588 1.81l-3.146 2.286a1 1 0 00-.364 1.118l1.2 3.698c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.726 2.698c-.784.57-1.838-.197-1.539-1.118l1.2-3.698a1 1 0 00-.364-1.118L2.425 9.125c-.783-.57-.38-1.81.588-1.81h3.887a1 1 0 00.95-.69l1.2-3.698z"
        />
      </svg>
    )
  }

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${rounded.toFixed(1)} out of ${outOf} stars`}
      >
        {Array.from({ length: outOf }).map((_, i) => (
          <Star key={i} pct={fillPct(i)} />
        ))}
      </div>
      {showNumber && (
        <span className="ml-1 text-xs text-gray-600">
          {rounded.toFixed(1)}
        </span>
      )}
    </div>
  )
}
