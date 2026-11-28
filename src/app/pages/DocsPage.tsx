import { Link, useParams, useNavigate } from 'react-router'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { DocsSidebar } from '../components/docs-sidebar'
import { MarkdownRenderer } from '../components/markdown-renderer'
import { getDocsIssueUrl } from '../components/doc-page-actions'
import {
  manifest,
  content,
  flatPages,
  stripLeadingH1,
  extractHeadings,
  readingMinutes,
  getReadPages,
  markRead,
  editUrl,
} from '../lib/docs'

function DraggableDocsNav({ children, isOpen, onToggle }: { children: React.ReactNode; isOpen: boolean; onToggle: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ x: 16, y: -1 })
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, btnX: 0, btnY: 0 })
  const moved = useRef(false)

  // Set initial Y after mount (bottom-right above status bar)
  useEffect(() => {
    if (pos.y === -1) {
      setPos({ x: 16, y: window.innerHeight - 100 })
    }
  }, [pos.y])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, btnX: pos.x, btnY: pos.y }
    btnRef.current?.setPointerCapture(e.pointerId)
  }, [pos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) moved.current = true
    const newX = Math.max(0, Math.min(window.innerWidth - 48, dragStart.current.btnX + dx))
    const newY = Math.max(0, Math.min(window.innerHeight - 48, dragStart.current.btnY + dy))
    setPos({ x: newX, y: newY })
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragging.current = false
    btnRef.current?.releasePointerCapture(e.pointerId)
    if (!moved.current) onToggle()
  }, [onToggle])

  if (pos.y === -1) return null

  return (
    <>
      {/* Draggable floating button */}
      <button
        ref={btnRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="md:hidden fixed z-40 px-3 py-2 bg-[var(--accent)] text-black font-mono text-xs font-bold border border-[var(--accent)] shadow-lg touch-none select-none"
        style={{ left: pos.x, top: pos.y }}
      >
        $ docs
      </button>

      {/* Overlay panel */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={onToggle} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] overflow-y-auto bg-[var(--bg-primary)] border-t border-[var(--accent)]">
            <div className="sticky top-0 flex items-center justify-between px-4 py-2 bg-[var(--bg-inverse)] border-b border-[var(--border-secondary)] font-mono text-xs">
              <span className="text-[var(--accent)]">$ docs navigation</span>
              <button onClick={onToggle} className="text-[var(--text-tertiary)] hover:text-[var(--text-heading)] px-2 py-1">[close]</button>
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

export default function DocsPage() {
  const params = useParams()
  const navigate = useNavigate()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [readPages, setReadPages] = useState<Set<string>>(() => getReadPages())
  const [activeId, setActiveId] = useState<string>('')
  const [progress, setProgress] = useState(0)

  const docPath = params['*'] ?? ''

  // /docs on its own opens the first page.
  useEffect(() => {
    if (!docPath && flatPages.length > 0) navigate(`/docs/${flatPages[0].page.path}`, { replace: true })
  }, [docPath, navigate])

  const index = useMemo(() => flatPages.findIndex((x) => x.page.path === docPath), [docPath])
  const current = index >= 0 ? flatPages[index] : null
  const prev = index > 0 ? flatPages[index - 1] : null
  const next = index >= 0 && index < flatPages.length - 1 ? flatPages[index + 1] : null

  const body = useMemo(() => (content[docPath] ? stripLeadingH1(content[docPath]) : ''), [docPath])
  const headings = useMemo(() => extractHeadings(body), [body])
  const minutes = useMemo(() => readingMinutes(body), [body])

  // Remember the page as read, close the mobile nav, start at the top.
  useEffect(() => {
    if (!current) return
    setReadPages(markRead(docPath))
    setMobileSidebarOpen(false)
    setActiveId(headings[0]?.id ?? '')
    window.scrollTo(0, 0)
  }, [docPath, current, headings])

  // Outline scroll spy + reading progress.
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      let cur = headings[0]?.id ?? ''
      for (const h of headings) {
        const el = document.getElementById(h.id)
        if (el && el.getBoundingClientRect().top < 140) cur = h.id
      }
      setActiveId(cur)
      const max = document.documentElement.scrollHeight - innerHeight
      setProgress(max > 0 ? Math.min(1, scrollY / max) : 0)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('resize', onScroll)
    return () => {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [headings])

  if (!docPath) return null

  return (
    <div>
      {/* Reading progress */}
      <div
        aria-hidden="true"
        className="fixed left-0 top-0 z-50 h-0.5 bg-[var(--accent)] transition-[width] duration-150"
        style={{ width: `${progress * 100}%` }}
      />

      {/* Mobile/tablet: draggable floating docs nav */}
      <DraggableDocsNav isOpen={mobileSidebarOpen} onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
        <DocsSidebar sections={manifest} activePath={docPath} readPages={readPages} />
      </DraggableDocsNav>

      <div className="grid min-h-[calc(100vh-12rem)] grid-cols-1 gap-8 md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_200px]">
        {/* Section tree: desktop only */}
        <aside className="hidden md:block">
          <div className="sticky top-4 max-h-[calc(100vh-5rem)] overflow-y-auto pr-1">
            <p className="mb-2 font-mono text-[10.5px] uppercase tracking-widest text-[var(--text-muted)]">
              $ docs · {readPages.size}/{flatPages.length} read
            </p>
            <DocsSidebar sections={manifest} activePath={docPath} readPages={readPages} />
          </div>
        </aside>

        {/* Page */}
        <article className="min-w-0 max-w-[74ch]">
          {current ? (
            <>
              <div className="flex flex-wrap gap-1.5 font-mono text-[11.5px] text-[var(--text-muted)]">
                <span className="text-[var(--accent)]">docs</span>
                <span>/</span>
                <span>{current.section.label}</span>
                <span>/</span>
                <span className="text-[var(--text-heading)]">{current.page.title}</span>
              </div>
              <h1 className="mb-1 mt-2 font-mono text-[28px] font-bold leading-tight tracking-tight text-[var(--text-heading)] md:text-[32px]">
                {current.page.title}
              </h1>
              {current.page.description && (
                <p className="mb-1 text-[15px] text-[var(--text-tertiary)]">{current.page.description}</p>
              )}
              <div className="mb-6 flex flex-wrap gap-4 font-mono text-[11.5px] text-[var(--text-muted)]">
                <span>{minutes} min read</span>
                <span>
                  page {index + 1} of {flatPages.length}
                </span>
                <a href={editUrl(docPath)} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                  edit this page ↗
                </a>
              </div>

              <MarkdownRenderer content={body} basePath={docPath} variant="docs" />

              {/* Previous / next */}
              <nav className="mt-10 grid grid-cols-1 gap-3 font-mono sm:grid-cols-2" aria-label="Previous and next page">
                {prev ? (
                  <Link
                    to={`/docs/${prev.page.path}`}
                    className="border border-[var(--border-secondary)] px-4 py-3 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)]"
                  >
                    ← previous
                    <span className="mt-0.5 block text-sm text-[var(--text-heading)]">{prev.page.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link
                    to={`/docs/${next.page.path}`}
                    className="border border-[var(--accent)] px-4 py-3 text-right text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-selected)]"
                  >
                    next →
                    <span className="mt-0.5 block text-sm text-[var(--text-heading)]">{next.page.title}</span>
                  </Link>
                )}
              </nav>

              <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-[var(--border-secondary)] pt-4 font-mono text-xs text-[var(--text-tertiary)]">
                <a href={getDocsIssueUrl(current.page.title)} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                  report an issue with this page ↗
                </a>
                <a href={editUrl(docPath)} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)]">
                  edit this page on GitHub ↗
                </a>
              </div>
            </>
          ) : (
            <div className="border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] p-8 text-center font-mono">
              <p className="mb-2 text-lg text-[var(--accent)]">404</p>
              <p className="text-sm text-[var(--text-tertiary)]">Page not found: {docPath}</p>
            </div>
          )}
        </article>

        {/* Outline: wide screens only */}
        {current && headings.length > 1 && (
          <aside className="hidden xl:block">
            <nav className="sticky top-4 font-mono text-xs" aria-label="On this page">
              <p className="mb-2 text-[10.5px] uppercase tracking-widest text-[var(--text-muted)]">On this page</p>
              <div className="grid gap-0.5">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`border-l-2 py-1 transition-colors ${h.level === 3 ? 'pl-5' : 'pl-2.5'} ${
                      activeId === h.id
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:text-[var(--text-heading)]'
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </div>
            </nav>
          </aside>
        )}
      </div>
    </div>
  )
}
