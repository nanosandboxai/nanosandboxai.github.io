import { useParams, useNavigate } from 'react-router'
import { useEffect, useMemo } from 'react'
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

export default function DocsPage() {
  const params = useParams()
  const navigate = useNavigate()

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

  if (!docPath) {
    return null // Will redirect
  }

  return (
    <div className="flex gap-6 min-h-[calc(100vh-12rem)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r border-[#333] pr-4 hidden md:block">
        <DocsSidebar sections={manifest} activePath={docPath} />
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        {currentSection && currentPage && (
          <div className="flex items-center gap-2 mb-4 font-mono text-xs text-[#666]">
            <span className="text-[#ff6b6b]">docs</span>
            <span>/</span>
            <span>{currentSection.label}</span>
            <span>/</span>
            <span className="text-white">{currentPage.title}</span>
          </div>
        )}

        {pageContent ? (
          <>
            <MarkdownRenderer content={pageContent} basePath={docPath} />
            <DocPageActions issueUrl={getDocsIssueUrl(currentPage?.title ?? '')} />
          </>
        ) : (
          <div className="border border-[#333] bg-[#111] p-8 text-center font-mono">
            <p className="text-[#ff6b6b] text-lg mb-2">404</p>
            <p className="text-[#888] text-sm">Page not found: {docPath}</p>
          </div>
        )}
      </div>
    </div>
  )
}
