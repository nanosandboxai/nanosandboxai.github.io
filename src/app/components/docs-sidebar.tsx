import { Link } from 'react-router'
import { useState } from 'react'

interface DocPage {
  slug: string
  title: string
  description: string
  order: number
  path: string
}

interface DocSection {
  slug: string
  label: string
  order: number
  pages: DocPage[]
}

interface DocsSidebarProps {
  sections: DocSection[]
  activePath: string
}

export function DocsSidebar({ sections, activePath }: DocsSidebarProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const section of sections) {
      // Expand the section that contains the active page
      initial[section.slug] = section.pages.some((p) => p.path === activePath)
    }
    // If nothing is expanded, expand the first section
    if (!Object.values(initial).some(Boolean) && sections.length > 0) {
      initial[sections[0].slug] = true
    }
    return initial
  })

  const toggle = (slug: string) => {
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }))
  }

  return (
    <nav className="font-mono text-sm">
      <div className="space-y-1">
        {sections.map((section) => (
          <div key={section.slug}>
            <button
              onClick={() => toggle(section.slug)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-[#888] hover:text-white hover:bg-[#111] transition-colors"
            >
              <span className="text-[#ff6b6b] text-xs">{expanded[section.slug] ? '▾' : '▸'}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{section.label}</span>
            </button>
            {expanded[section.slug] && (
              <div className="ml-4 border-l border-[#333] space-y-0.5">
                {section.pages.map((page) => {
                  const isActive = page.path === activePath
                  return (
                    <Link
                      key={page.path}
                      to={`/docs/${page.path}`}
                      className={`block px-3 py-1.5 text-xs transition-colors ${
                        isActive
                          ? 'text-[#ff6b6b] bg-[#1a1a1a] border-l-2 border-[#ff6b6b] -ml-px'
                          : 'text-[#888] hover:text-white hover:bg-[#0d0d0d]'
                      }`}
                    >
                      {page.title}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}
