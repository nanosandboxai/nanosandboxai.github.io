import { Link } from 'react-router'

const LINKS: Array<{ label: string; to: string; external?: boolean }> = [
  { label: 'Docs', to: '/docs' },
  { label: 'Agents', to: '/agents' },
  { label: 'MCP', to: '/mcp' },
  { label: 'Skills', to: '/skill' },
  { label: 'Articles', to: '/articles' },
  { label: 'Coming soon', to: '/coming-soon' },
  { label: 'GitHub', to: 'https://github.com/nanosandboxai', external: true },
]

// Shared footer for every public page, in the same boxed terminal style as the page heroes.
export default function SiteFooter() {
  return (
    <footer className="mt-8 grid gap-4 border border-[var(--border-primary)] bg-[var(--bg-inverse)] p-5 font-mono text-xs md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex items-center gap-3">
        <img src="/logo.svg" alt="" className="h-8 w-8 flex-shrink-0" />
        <div>
          <p className="font-bold text-[var(--accent)]">NANOSANDBOX</p>
          <p className="text-[var(--text-muted)]">
            Open source · © 2026 · <span className="text-[var(--terminal-green)]">0 escapes</span>
          </p>
        </div>
      </div>
      <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[var(--text-tertiary)]" aria-label="Footer">
        {LINKS.map((l) =>
          l.external ? (
            <a key={l.label} href={l.to} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--accent)]">
              {l.label} ↗
            </a>
          ) : (
            <Link key={l.label} to={l.to} className="transition-colors hover:text-[var(--accent)]">
              {l.label}
            </Link>
          )
        )}
      </nav>
    </footer>
  )
}
