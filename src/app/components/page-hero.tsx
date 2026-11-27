import type { ReactNode } from 'react'

interface PageHeroProps {
  /** Terminal-style kicker, e.g. "nanosb mcp list" */
  command: string
  title: ReactNode
  /** Second headline line, shown in the accent colour */
  accent?: ReactNode
  description?: ReactNode
  children?: ReactNode
}

// Shared page header in the home page's style: terminal kicker and a two-tone headline.
// The 3D isolation layers stay on the home page only.
export default function PageHero({ command, title, accent, description, children }: PageHeroProps) {
  return (
    <section className="mb-6 min-w-0 border border-[var(--border-primary)] bg-[var(--bg-inverse)] p-5 font-mono md:p-8">
      <p className="mb-2 text-xs text-[var(--text-muted)]">
        <span className="text-[var(--accent)]">$</span> {command}
      </p>
      <h1 className="mb-3 text-2xl font-bold leading-[1.1] tracking-tight text-[var(--text-heading)] md:text-4xl">
        {title}
        {accent && (
          <>
            <br />
            <span className="text-[var(--accent)]">{accent}</span>
          </>
        )}
      </h1>
      {description && <div className="max-w-3xl text-sm leading-relaxed text-[var(--text-tertiary)]">{description}</div>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  )
}
