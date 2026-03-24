import { useParams, useNavigate } from 'react-router'
import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { DocsSidebar } from '../components/docs-sidebar'
import { MarkdownRenderer } from '../components/markdown-renderer'
import { DocPageActions, getDocsIssueUrl } from '../components/doc-page-actions'
import docsManifest from '@/data/docs-manifest.json'
import docsContent from '@/data/docs-content.json'

const manifest = docsManifest as Array<{
  slug: string
  label: string
  order: number
  pages: Array<{ slug: string; title: string; description: string; order: number; path: string }>
}>

const content = docsContent as Record<string, string>

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

  // Build the path from URL params: /docs/section/page
  const docPath = useMemo(() => {
    const wildcard = params['*']
    if (wildcard) return wildcard
    return ''
  }, [params])

  // Redirect to first page if no path specified
  useEffect(() => {
    if (!docPath && manifest.length > 0 && manifest[0].pages.length > 0) {
      navigate(`/docs/${manifest[0].pages[0].path}`, { replace: true })
    }
  }, [docPath, navigate])

  // Find the current page info
  const currentPage = useMemo(() => {
    for (const section of manifest) {
      for (const page of section.pages) {
        if (page.path === docPath) return page
      }
    }
    return null
  }, [docPath])

  // Find the current section
  const currentSection = useMemo(() => {
    for (const section of manifest) {
      if (section.pages.some((p) => p.path === docPath)) return section
    }
    return null
  }, [docPath])

  const pageContent = content[docPath]

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [docPath])

  if (!docPath) {
    return null // Will redirect
  }

  return (
    <div>
      {/* Mobile/tablet: draggable floating docs nav */}
      <DraggableDocsNav isOpen={mobileSidebarOpen} onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}>
        <DocsSidebar sections={manifest} activePath={docPath} />
      </DraggableDocsNav>

      <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
        {/* Sidebar — desktop only */}
        <aside className="w-56 flex-shrink-0 border-r border-[var(--border-secondary)] pr-4 hidden md:block">
          <DocsSidebar sections={manifest} activePath={docPath} />
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumbs */}
          {currentSection && currentPage && (
            <div className="flex items-center gap-2 mb-4 font-mono text-xs text-[var(--text-muted)]">
              <span className="text-[var(--accent)]">docs</span>
              <span>/</span>
              <span>{currentSection.label}</span>
              <span>/</span>
              <span className="text-[var(--text-heading)]">{currentPage.title}</span>
            </div>
          )}

        {pageContent ? (
          <>
            <MarkdownRenderer content={pageContent} basePath={docPath} />
            <DocPageActions issueUrl={getDocsIssueUrl(currentPage?.title ?? '')} />
          </>
        ) : (
          <div className="border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] p-8 text-center font-mono">
            <p className="text-[var(--accent)] text-lg mb-2">404</p>
            <p className="text-[var(--text-tertiary)] text-sm">Page not found: {docPath}</p>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
