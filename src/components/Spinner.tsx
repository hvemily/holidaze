// src/components/Spinner.tsx
type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  inline?: boolean
  className?: string
}

export default function Spinner({
  size = 'md',
  inline = false,
  className = '',
}: SpinnerProps) {
  const sizeCls =
    size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-7 w-7' : 'h-5 w-5'

  return (
    <div
      className={`${inline
        ? 'flex items-center space-x-1'
        : 'flex items-center justify-center py-10 space-x-2'
      } ${className}`}
    >
      <div
        className={`${sizeCls} rounded-full bg-red-600 animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div
        className={`${sizeCls} rounded-full bg-white border border-gray-300 animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div
        className={`${sizeCls} rounded-full bg-blue-600 animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  )
}
