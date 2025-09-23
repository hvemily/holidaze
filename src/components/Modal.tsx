// src/components/Modal.tsx
import type { ReactNode } from 'react'
import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  className?: string // optional extra classes for the panel
}) {
  const titleId = useId()

  // ESC to close + lock body scroll while open
  useEffect(() => {
    if (!open) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Panel wrapper – stop click bubbling */}
      <div className="relative z-10 mx-4 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Panel: max-h + egen scroll */}
        <div
          className={clsx(
            'rounded-2xl bg-white shadow-lg border',
            'max-h-[85vh] overflow-y-auto overscroll-contain',
            'p-4',
            className
          )}
        >
          <div className="flex items-center justify-between mb-3">
            {title && (
              <h3 id={titleId} className="text-lg font-semibold">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="rounded-md border px-2 py-1 text-sm"
              aria-label="Close modal"
            >
              Close
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
