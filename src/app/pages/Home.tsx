import { lazy, Suspense, useState, useCallback } from 'react'
import { Link } from 'react-router'
import TerminalDemo from '@/app/components/terminal-demo'
import IsolationLayers from '@/app/components/isolation-layers'

// three.js is heavy: load the 3D hero in its own chunk.
const HypervisorPanopticon = lazy(() => import('@/app/components/hypervisor-panopticon'))

const INSTALL_CMD = 'curl -fsSL https://github.com/nanosandboxai/nanosandbox/releases/latest/download/install.sh | bash'

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={`text-[var(--text-tertiary)] text-xs hover:text-[var(--text-heading)] transition-colors ${className}`}
    >
      {copied ? '[copied!]' : '[copy]'}
    </button>
  )
}

export default function Home() {
  // Opening section: brand, headline and install, shown above the 3D layer stack.
  const layersIntro = (
    <div className="mb-5">
      <div className="mb-4 flex items-center gap-3">
        <img src="/logo.svg" alt="" className="h-11 w-11 flex-shrink-0" />
        <div>
          <p className="text-sm font-bold tracking-wide text-[var(--accent)]">NANOSANDBOX</p>
          <p className="text-xs text-[var(--text-tertiary)]">VM-isolated sandboxes for AI code agents</p>
        </div>
      </div>
      <h1 className="mb-3 text-3xl font-bold leading-[1.05] tracking-tight text-[var(--text-heading)] md:text-[42px]">
        Five walls between your agent
        <br />
        <span className="text-[var(--accent)]">and your laptop.</span>
      </h1>
      <p className="mb-4 max-w-md text-sm leading-relaxed text-[var(--text-tertiary)]">
        Every AI code agent runs in its own hardware-isolated microVM, with its own kernel, and boots in about 180&nbsp;ms. Scroll
        to take the stack apart.
      </p>
      <div className="flex min-w-0 items-center gap-2 border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] px-3 py-2.5">
        <span className="text-[var(--accent)]">$</span>
        <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-[var(--text-primary)]">{INSTALL_CMD}</code>
        <CopyButton text={INSTALL_CMD} />
      </div>
    </div>
  )

  // Second section: the 3D Panopticon, where the walls get tested.
  const panopticonCopy = (
    <div className="bg-[var(--scene-scrim)] p-4 backdrop-blur-[2px] lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
      <p className="mb-2 text-xs uppercase tracking-widest text-[var(--accent-hover)]">$ watch them try</p>
      <h2 className="mb-3 text-3xl font-bold leading-[1.05] tracking-tight text-[var(--scene-heading)] md:text-5xl">
        Six agents. Six cells.
        <br />
        <span className="text-[var(--accent-hover)]">Zero escapes.</span>
      </h2>
      <p className="max-w-md text-sm leading-relaxed text-[var(--scene-text)]">
        Each agent is boxed in by the same five walls. Every few seconds one tries to break out, and the log names the wall that
        stopped it. Click a cell to make one try.
      </p>
    </div>
  )

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      {/* 1. Hero: scroll-driven 3D isolation layers */}
      <IsolationLayers intro={layersIntro} />

      {/* 2. 3D Hypervisor Panopticon */}
      <Suspense
        fallback={
          <div className="panopticon relative p-5 font-mono md:p-8">
            <div className="max-w-xl">{panopticonCopy}</div>
            <p className="absolute bottom-5 left-5 text-xs text-[var(--scene-dim)]">booting 6 microVMs…</p>
          </div>
        }
      >
        <HypervisorPanopticon>{panopticonCopy}</HypervisorPanopticon>
      </Suspense>

      {/* Stats strip */}
      <div className="grid grid-cols-2 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] font-mono md:grid-cols-4">
        {[
          ['180ms', 'median cold boot'],
          ['1 : 1', 'agent to kernel'],
          ['HVF · KVM', 'hardware boundary'],
          ['0', 'escapes, ever'],
        ].map(([v, k], i) => (
          <div
            key={k}
            className={`p-4 ${i % 2 === 0 ? 'border-r' : 'md:border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} border-[var(--border-secondary)] last:border-r-0`}
          >
            <div className="text-2xl font-bold tabular-nums text-[var(--accent)]">{v}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{k}</div>
          </div>
        ))}
      </div>

      {/* Terminal demo + commands */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <div className="min-w-0">
          <TerminalDemo />
        </div>
        <div className="min-w-0 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
          <h2 className="mb-3 text-lg font-bold text-[var(--accent)]">$ Common Commands</h2>
          <div className="space-y-1.5 text-xs">
            {[
              { cmd: 'nanosb pull <IMAGE>', desc: 'Pull an OCI image from a registry' },
              { cmd: 'nanosb run <IMAGE> [CMD]', desc: 'Run a command in a new sandbox' },
              { cmd: 'nanosb exec <ID> <CMD>', desc: 'Execute command in running sandbox' },
              { cmd: 'nanosb ps', desc: 'List running sandboxes' },
              { cmd: 'nanosb stop <SANDBOX>', desc: 'Stop a running sandbox' },
              { cmd: 'nanosb rm <SANDBOX>', desc: 'Remove a sandbox' },
              { cmd: 'nanosb images', desc: 'List cached images' },
              { cmd: 'nanosb doctor', desc: 'Check runtime prerequisites' },
              { cmd: 'nanosb cleanup', desc: 'Clean up stale project clones' },
            ].map((c) => (
              <div key={c.cmd} className="group flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
                <span className="text-[var(--text-heading)] sm:w-44 sm:flex-shrink-0">{c.cmd}</span>
                <span className="flex-1 text-[var(--text-tertiary)]">{c.desc}</span>
                <CopyButton text={c.cmd} className="hidden opacity-0 group-hover:opacity-100 sm:inline" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="grid gap-4 border border-[var(--border-primary)] bg-[var(--bg-inverse)] p-6 font-mono md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <h2 className="mb-1 text-lg font-bold text-[var(--accent)]">$ What's next</h2>
          <p className="text-xs text-[var(--text-tertiary)]">Release notes, deep dives and the roadmap for the desktop app and the agent caging tournament.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link to="/articles" className="border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-black transition hover:brightness-105">
            read the articles
          </Link>
          <Link to="/coming-soon" className="border border-[var(--border-secondary)] px-4 py-2 text-[var(--text-heading)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]">
            see the roadmap
          </Link>
        </div>
      </div>

    </div>
  )
}
