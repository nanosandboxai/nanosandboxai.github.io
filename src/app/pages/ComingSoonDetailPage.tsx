import { useParams, Link } from 'react-router'
import { useMemo } from 'react'
import { MarkdownRenderer } from '../components/markdown-renderer'
import { DocPageActions, getArticleIssueUrl } from '../components/doc-page-actions'
import comingSoonData from '@/data/coming-soon.json'

interface ComingSoonPost {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  author: string
  content: string
}

const posts = comingSoonData as ComingSoonPost[]

export default function ComingSoonDetailPage() {
  const { slug } = useParams()

  const post = useMemo(() => posts.find((p) => p.slug === slug), [slug])

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="border border-[#333] bg-[#111] p-8 text-center font-mono">
          <p className="text-[#ff6b6b] text-lg mb-2">404</p>
          <p className="text-[#888] text-sm">Post not found: {slug}</p>
          <Link to="/coming-soon" className="text-[#ff6b6b] text-sm hover:underline mt-4 inline-block">
            Back to coming soon
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 font-mono text-xs text-[#666]">
        <Link to="/coming-soon" className="text-[#ff6b6b] hover:underline">
          coming soon
        </Link>
        <span>/</span>
        <span className="text-white">{post.title}</span>
      </div>

      {/* Post metadata */}
      <div className="mb-6 font-mono">
        <div className="flex items-center gap-3 text-xs text-[#666] mb-2">
          {post.date && <span>{post.date}</span>}
          {post.author && <span>{post.author}</span>}
        </div>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-[#888] text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <MarkdownRenderer content={post.content} />
      <DocPageActions issueUrl={getArticleIssueUrl(post.title)} />
    </div>
  )
}
