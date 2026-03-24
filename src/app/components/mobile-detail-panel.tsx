import { useState, useEffect } from 'react'

interface MobileDetailPanelProps {
  children: React.ReactNode
  triggerLabel: string
  hasContent: boolean
}

export function MobileDetailPanel({ children, triggerLabel, hasContent }: MobileDetailPanelProps) {
  const [open, setOpen] = useState(false)

  // Close on escape key
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Desktop: normal sidebar */}
      <div className="hidden md:block w-80 flex-shrink-0">
        <div className="sticky top-4">
          {children}
        </div>
      </div>

      {/* Mobile: floating button + slide-up panel */}
      {hasContent && (
        <button
          onClick={() => setOpen(true)}
          className="md:hidden fixed bottom-10 right-4 z-40 px-4 py-2 bg-[var(--accent)] text-black font-mono text-xs font-bold border border-[var(--accent)] shadow-lg"
        >
          $ {triggerLabel}
        </button>
      )}

      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto bg-[var(--bg-primary)] border-t border-[var(--accent)]">
            <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[var(--bg-inverse)] border-b border-[var(--border-secondary)] font-mono text-xs">
              <span className="text-[var(--accent)]">$ {triggerLabel}</span>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-heading)] px-2 py-1"
              >
                [close]
              </button>
            </div>
            <div className="p-4">
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
