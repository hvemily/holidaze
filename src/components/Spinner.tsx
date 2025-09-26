// src/components/Spinner.tsx
type SpinnerProps = {
  /** Size of the dots (default: md). */
  size?: 'sm' | 'md' | 'lg'
  /** Inline mode = small, horizontally aligned with text. */
  inline?: boolean
  /** Optional extra classes for wrapper. */
  className?: string
}

/**
 * Animated bouncing-dot spinner.
 *
 * - Uses three colored dots with staggered bounce delays.
 * - Default renders centered in a block with padding.
 * - `inline` mode makes it compact and align with surrounding text.
 */
export default function Spinner({
  size = 'md',
  inline = false,
  className = '',
}: SpinnerProps) {
  const sizeCls =
    size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${inline
        ? 'flex items-center space-x-1'
        : 'flex items-center justify-center space-x-2 py-10'
      } ${className}`}
    >
      {/* Red dot */}
      <div
        className={`${sizeCls} animate-bounce rounded-full bg-red-600`}
        style={{ animationDelay: '0ms' }}
      />
      {/* White dot */}
      <div
        className={`${sizeCls} animate-bounce rounded-full border border-gray-300 bg-white`}
        style={{ animationDelay: '150ms' }}
      />
      {/* Blue dot */}
      <div
        className={`${sizeCls} animate-bounce rounded-full bg-blue-600`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}
