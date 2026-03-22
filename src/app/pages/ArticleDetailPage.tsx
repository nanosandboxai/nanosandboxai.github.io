import { useParams, Link } from 'react-router'
import { useMemo } from 'react'
import { MarkdownRenderer } from '../components/markdown-renderer'
import { DocPageActions, getArticleIssueUrl } from '../components/doc-page-actions'
import articlesData from '@/data/articles.json'

interface Article {
  slug: string
  title: string
  date: string
  description: string
  tags: string[]
  author: string
  content: string
}

const articles = articlesData as Article[]

export default function ArticleDetailPage() {
  const { slug } = useParams()

  const article = useMemo(() => articles.find((a) => a.slug === slug), [slug])

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="border border-[#333] bg-[#111] p-8 text-center font-mono">
          <p className="text-[#ff6b6b] text-lg mb-2">404</p>
          <p className="text-[#888] text-sm">Article not found: {slug}</p>
          <Link to="/articles" className="text-[#ff6b6b] text-sm hover:underline mt-4 inline-block">
            Back to articles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4 font-mono text-xs text-[#666]">
        <Link to="/articles" className="text-[#ff6b6b] hover:underline">
          articles
        </Link>
        <span>/</span>
        <span className="text-white">{article.title}</span>
      </div>

      {/* Article metadata */}
      <div className="mb-6 font-mono">
        <div className="flex items-center gap-3 text-xs text-[#666] mb-2">
          {article.date && <span>{article.date}</span>}
          {article.author && <span>{article.author}</span>}
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-[#888] text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <MarkdownRenderer content={article.content} />
      <DocPageActions issueUrl={getArticleIssueUrl(article.title)} />
    </div>
  )
}
