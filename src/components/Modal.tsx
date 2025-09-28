// src/components/Modal.tsx
import type { ReactNode } from 'react'
import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

/**
 * accessible modal dialog component.
 *
 * features:
 * - bocks body scroll while open.
 * - closes on `Escape` key or overlay click.
 * - uses React portal to render into <body>.
 * - supports optional title (linked via aria-labelledby).
 * - panel has its own scroll with max-height.
 */
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

  useEffect(() => {
    if (!open) return

    // save current body overflow setting
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // close on ESC key
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
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* panel wrapper – prevents overlay click bubbling */}
      <div
        className="relative z-10 mx-4 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel: max-h + own scroll */}
        <div
          className={clsx(
            'border rounded-2xl bg-white p-4 shadow-lg',
            'max-h-[85vh] overflow-y-auto overscroll-contain',
            className
          )}
        >
          {/* header */}
          <div className="mb-3 flex items-center justify-between">
            {title && (
              <h3 id={titleId} className="text-lg font-semibold">
                {title}
              </h3>
            )}
            <button
              onClick={onClose}
              className="rounded-md border px-2 py-1 text-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close modal"
              type="button"
            >
              Close
            </button>
          </div>

          {/* content */}
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
