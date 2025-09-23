import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastKind = 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string; timeout?: number }

type ToastCtx = {
  success: (msg: string, timeout?: number) => void
  error: (msg: string, timeout?: number) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((kind: ToastKind, message: string, timeout = 3500) => {
    const id = Date.now() + Math.random()
    const item: ToastItem = { id, kind, message, timeout }
    setItems(prev => [...prev, item])
    if (timeout > 0) {
      window.setTimeout(() => remove(id), timeout)
    }
  }, [remove])

  const api = useMemo<ToastCtx>(() => ({
    success: (m, t) => push('success', m, t),
    error:   (m, t) => push('error',   m, t),
  }), [push])

  return (
    <Ctx.Provider value={api}>
      {children}
      {createPortal(
        <ToastContainer items={items} onClose={remove} />,
        document.body
      )}
    </Ctx.Provider>
  )
}

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
  // Mobil: midtstilt overlay, Desktop: hjørne-stack
  return (
    <>
      {/* Backdrop kun på mobil når det finnes en toast */}
      <div className={`fixed inset-0 z-[60] bg-black/20 md:hidden transition
        ${items.length ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} />

      <div
        className={`
          fixed z-[61]
          md:bottom-4 md:right-4 md:left-auto md:top-auto
          md:flex md:flex-col md:items-end md:gap-2
          inset-0 md:inset-auto
          ${items.length ? 'pointer-events-auto' : 'pointer-events-none'}
          flex md:block items-center justify-center
        `}
        aria-live="polite" aria-atomic="true"
      >
        <div className="md:w-80 w-[min(92%,28rem)] mx-auto md:mx-0 grid gap-2">
          {items.map(t => (
            <ToastCard key={t.id} item={t} onClose={() => onClose(t.id)} />
          ))}
        </div>
      </div>
    </>
  )
}

function ToastCard({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const styles =
    item.kind === 'success'
      ? 'bg-green-50 border-green-200 text-green-900'
      : 'bg-red-50 border-red-200 text-red-900'

  const icon =
    item.kind === 'success' ? (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.364 7.364a1 1 0 0 1-1.414 0L3.293 9.435a1 1 0 1 1 1.414-1.414l3.221 3.221 6.657-6.657a1 1 0 0 1 1.414 0z"/></svg>
    ) : (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM9 6h2v6H9V6zm0 8h2v2H9v-2z"/></svg>
    )

  return (
    <div className={`pointer-events-auto rounded-xl border shadow-md ${styles} p-3 flex items-start gap-3`}>
      <div className="mt-0.5">{icon}</div>
      <div className="text-sm leading-5">{item.message}</div>
      <button
        onClick={onClose}
        className="ml-auto inline-flex rounded-md px-2 py-1 text-xs opacity-70 hover:opacity-100"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  )
}
