interface DocPageActionsProps {
  issueUrl: string
}

export function DocPageActions({ issueUrl }: DocPageActionsProps) {
  return (
    <div className="flex items-center gap-4 mt-8 pt-4 border-t border-[#333] font-mono text-xs">
      <a
        href={issueUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[#888] hover:text-[#ff6b6b] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Report an issue
      </a>
    </div>
  )
}

export function getDocsIssueUrl(title: string): string {
  const params = new URLSearchParams({
    title: `Docs: ${title}`,
    labels: 'documentation',
    body: `Issue with documentation page: ${title}\n\n---\nPlease describe the issue:`,
  })
  return `https://github.com/nanosandboxai/nanosandbox.ai/issues/new?${params.toString()}`
}

export function getArticleIssueUrl(title: string): string {
  const params = new URLSearchParams({
    title: `Article: ${title}`,
    labels: 'content',
    body: `Issue with article: ${title}\n\n---\nPlease describe the issue:`,
  })
  return `https://github.com/nanosandboxai/articles/issues/new?${params.toString()}`
}
