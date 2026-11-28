import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import type { DocSection } from '../lib/docs'

interface DocsSidebarProps {
  sections: DocSection[]
  activePath: string
  /** Pages this reader has opened before (kept in the browser) */
  readPages?: Set<string>
}

// Section tree for the docs reader: collapsible sections with a read count,
// and a dot per page that fills in once the page has been read.
export function DocsSidebar({ sections, activePath, readPages = new Set() }: DocsSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of sections) initial[section.slug] = section.pages.some((p) => p.path === activePath)
    if (!Object.values(initial).some(Boolean) && sections.length > 0) initial[sections[0].slug] = true
    return initial
  })

  // Open the section of the page being read when navigating between sections.
  useEffect(() => {
    const owner = sections.find((s) => s.pages.some((p) => p.path === activePath))
    if (owner) setExpanded((prev) => (prev[owner.slug] ? prev : { ...prev, [owner.slug]: true }))
  }, [activePath, sections])

  return (
    <nav className="font-mono text-[12.5px]" aria-label="Documentation">
      <div className="space-y-0.5">
        {sections.map((section) => {
          const read = section.pages.filter((p) => readPages.has(p.path)).length
          const open = expanded[section.slug]
          return (
            <div key={section.slug} className="border-b border-dashed border-[var(--border-secondary)] py-1">
              <button
                type="button"
                onClick={() => setExpanded((prev) => ({ ...prev, [section.slug]: !prev[section.slug] }))}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-2 px-1 py-1.5 text-left text-[var(--text-heading)] transition-colors hover:text-[var(--accent)]"
              >
                <span>
                  <span className="mr-1.5 text-[10px] text-[var(--accent)]">{open ? '▾' : '▸'}</span>
                  {section.label}
                </span>
                <span className="text-[10.5px] tabular-nums text-[var(--text-muted)]">
                  {read}/{section.pages.length}
                </span>
              </button>
              {open && (
                <div className="mb-1 space-y-px">
                  {section.pages.map((page) => {
                    const isActive = page.path === activePath
                    const isRead = readPages.has(page.path)
                    return (
                      <Link
                        key={page.path}
                        to={`/docs/${page.path}`}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex items-center gap-2 border-l-2 py-1 pl-3 pr-1 transition-colors ${
                          isActive
                            ? 'border-[var(--accent)] bg-[var(--bg-selected)] text-[var(--accent)]'
                            : 'border-transparent text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-heading)]'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 flex-shrink-0 rounded-full border ${
                            isRead ? 'border-[var(--terminal-green)] bg-[var(--terminal-green)]' : 'border-[var(--border-primary)]'
                          }`}
                        />
                        <span>{page.title}</span>
                        {isRead && <span className="sr-only">(read)</span>}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )
}
