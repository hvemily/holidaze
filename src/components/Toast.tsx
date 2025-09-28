// src/components/Toast.tsx
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastKind = 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string; timeout?: number }

type ToastCtx = {
  /** show a green success toast. */
  success: (msg: string, timeout?: number) => void
  /** show a red error toast. */
  error: (msg: string, timeout?: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)

/**
 * ToastProvider renders a portal-based toast stack and exposes helpers via context.
 *
 * features:
 * - success/Error variants with optional timeout (default: 3500ms)
 * - mobile overlay (taps outside are ignored; visual backdrop only)
 * - desktop stacks toasts bottom-right
 * - screen-reader friendly: error uses `role="alert"`, success uses `role="status"`
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string, timeout = 3500) => {
      const id = Date.now() + Math.random()
      const item: ToastItem = { id, kind, message, timeout }
      setItems((prev) => [...prev, item])

      if (timeout > 0) {
        // fire-and-forget timer; safe because `remove` is stable via useCallback
        window.setTimeout(() => remove(id), timeout)
      }
    },
    [remove]
  )

  const api = useMemo<ToastCtx>(
    () => ({
      success: (m, t) => push('success', m, t),
      error: (m, t) => push('error', m, t),
    }),
    [push]
  )

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(<ToastContainer items={items} onClose={remove} />, document.body)}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

function ToastContainer({
  items,
  onClose,
}: {
  items: ToastItem[]
  onClose: (id: number) => void
}) {
  // mobile: centered with subtle backdrop
  // desktop: bottom-right stack
  return (
    <>
      {/* backdrop (mobile only) */}
      <div
        className={`fixed inset-0 z-[60] bg-black/20 transition md:hidden
          ${items.length ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}
        `}
        aria-hidden="true"
      />

      <div
        className={`
          fixed z-[61]
          inset-0 flex items-center justify-center
          md:inset-auto md:bottom-4 md:right-4 md:flex md:flex-col md:items-end md:gap-2
          ${items.length ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="grid w-[min(92%,28rem)] gap-2 md:mx-0 md:w-80">
          {items.map((t) => (
            <ToastCard key={t.id} item={t} onClose={() => onClose(t.id)} />
          ))}
        </div>
      </div>
    </>
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const isSuccess = item.kind === 'success'
  const styles = isSuccess
    ? 'bg-green-50 border-green-200 text-green-900'
    : 'bg-red-50 border-red-200 text-red-900'

  const icon = isSuccess ? (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.364 7.364a1 1 0 0 1-1.414 0L3.293 9.435a1 1 0 1 1 1.414-1.414l3.221 3.221 6.657-6.657a1 1 0 0 1 1.414 0z" />
    </svg>
  ) : (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM9 6h2v6H9V6zm0 8h2v2H9v-2z" />
    </svg>
  )

  // role hints screen readers to announce appropriately:
  // - error → alert (assertive)
  // - success → status (polite)
  const role = isSuccess ? 'status' : 'alert'

  return (
    <div
      role={role}
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-md ${styles}`}
      data-kind={item.kind}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm leading-5">{item.message}</div>
      <button
        onClick={onClose}
        type="button"
        className="ml-auto inline-flex rounded-md px-2 py-1 text-xs opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  )
}
