import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Layer {
  id: number
  short: string
  label: string
  title: string
  body: string
  features: string[]
}

// Bottom (host) to top (agent), matching the stack's Z order.
const LAYERS: Layer[] = [
  {
    id: 0,
    short: 'host',
    label: 'L0 host · macOS / Linux',
    title: 'Your machine stays clean',
    body: 'Secrets are injected per sandbox, never mounted. nanosb rm leaves nothing behind.',
    features: ['Multi-Agent TUI'],
  },
  {
    id: 1,
    short: 'hypervisor',
    label: 'L1 hypervisor · HVF / KVM',
    title: 'Hardware virtualization',
    body: 'Hypervisor.framework on Apple Silicon, KVM on Linux. The CPU enforces the boundary.',
    features: ['Cross-Platform'],
  },
  {
    id: 2,
    short: 'microVM',
    label: 'L2 libkrun microVM',
    title: 'libkrun microVM, sub-second boot',
    body: 'A minimal VM with VirtioFS mounts. The agent edits a git clone, not your working tree.',
    features: ['Sub-Second Boot', 'Project Mounting'],
  },
  {
    id: 3,
    short: 'guest kernel',
    label: 'L3 guest kernel + seccomp',
    title: 'Its own kernel and syscall filter',
    body: 'Every sandbox boots an independent kernel, with syscall filtering and package-install policy inside the guest.',
    features: ['Streaming I/O'],
  },
  {
    id: 4,
    short: 'agent',
    label: 'agent',
    title: 'The agent gets root, in a cell of its own',
    body: 'Claude, Codex or Goose has full control of an OCI image. Nothing it runs touches your shell.',
    features: ['OCI Images', 'MCP Servers'],
  },
]

export default function IsolationLayers({ intro }: { intro?: ReactNode }) {
  const [active, setActive] = useState(4)
  const [gap, setGap] = useState(6) // starts collapsed, assembles on mount
  const sectionRef = useRef<HTMLElement>(null)
  const heldUntil = useRef(0)

  // Assemble on mount, then spread further as the hero scrolls away.
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const update = () => {
      raf = 0
      const sec = sectionRef.current
      if (!sec) return
      const p = Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / (sec.offsetHeight * 0.8)))
      setGap(reduce ? 44 : 44 + p * 40)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const t = setTimeout(update, reduce ? 0 : 120)
    addEventListener('scroll', onScroll, { passive: true })
    return () => {
      clearTimeout(t)
      removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // Walk down the stack on its own until the visitor picks a layer.
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => {
      if (Date.now() < heldUntil.current) return
      setActive((a) => (a + 4) % 5)
    }, 2600)
    return () => clearInterval(id)
  }, [])

  const pick = (id: number) => {
    heldUntil.current = Date.now() + 8000
    setActive(id)
  }
  const cur = LAYERS.find((l) => l.id === active)!

  return (
    <section
      ref={sectionRef}
      className="grid min-w-0 items-center gap-8 overflow-hidden border border-[var(--border-primary)] bg-[var(--bg-inverse)] p-5 font-mono md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]"
    >
      <div className="min-w-0">
        {intro}

        {/* Layer switcher */}
        <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Isolation layers">
          {[...LAYERS].reverse().map((l) => (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={active === l.id}
              onClick={() => pick(l.id)}
              onMouseEnter={() => pick(l.id)}
              className={`border px-2.5 py-1 text-xs transition-colors ${
                active === l.id
                  ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                  : 'border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--accent)] hover:text-[var(--text-heading)]'
              }`}
            >
              L{l.id} {l.short}
            </button>
          ))}
        </div>

        {/* Detail for the highlighted layer: fixed height so the page does not jump */}
        <div className="min-h-[124px] border-l-2 border-[var(--accent)] pl-4" aria-live="polite">
          <h2 key={cur.id} className="layer-detail mb-1 text-base font-bold text-[var(--text-heading)]">
            {cur.title}
          </h2>
          <p key={`b${cur.id}`} className="layer-detail mb-2 text-[13px] leading-relaxed text-[var(--text-tertiary)]">
            {cur.body}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {cur.features.map((f) => (
              <span key={f} className="text-[var(--text-heading)]">
                <span className="text-[var(--accent)]">&#10003;</span> {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3D exploded stack */}
      <div className="layer-stage" style={{ ['--gap' as string]: `${gap}px` }} aria-label="Exploded diagram of isolation layers">
        <div className="layer-stack">
          {LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`layer ${l.id === 4 ? 'layer-core' : ''} ${active === l.id ? 'is-on' : ''}`}
              style={{ ['--i' as string]: l.id }}
              onMouseEnter={() => pick(l.id)}
              onFocus={() => pick(l.id)}
              onClick={() => pick(l.id)}
              aria-label={l.label}
            >
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
