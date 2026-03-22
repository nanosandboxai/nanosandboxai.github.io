import { useState, useMemo } from 'react'
import { Link } from 'react-router'
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

const articles = (articlesData as Article[]).sort(
  (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
)

// Collect all unique tags
const allTags = Array.from(new Set(articles.flatMap((a) => a.tags))).sort()

export default function ArticlesPage() {
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch =
        !search ||
        article.title.toLowerCase().includes(search.toLowerCase()) ||
        article.description.toLowerCase().includes(search.toLowerCase())

      const matchesTags =
        selectedTags.size === 0 || article.tags.some((t) => selectedTags.has(t))

      return matchesSearch && matchesTags
    })
  }, [search, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 font-mono">
        <h1 className="text-2xl font-bold text-[#ff6b6b] mb-2">Articles</h1>
        <p className="text-[#888] text-sm">Technical articles about sandboxing, isolation, and AI agent security.</p>
      </div>

      {/* Search and filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff6b6b] font-mono text-sm">$</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="grep -i 'search articles...'"
            className="w-full bg-[#111] border border-[#333] text-white font-mono text-sm px-3 py-2 pl-7 placeholder-[#555] focus:outline-none focus:border-[#ff6b6b] transition-colors"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 text-xs font-mono border transition-colors ${
                  selectedTags.has(tag)
                    ? 'bg-[#ff6b6b] border-[#ff6b6b] text-black'
                    : 'bg-[#1a1a1a] border-[#333] text-[#888] hover:border-[#555] hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="px-2 py-0.5 text-xs font-mono text-[#ff6b6b] hover:underline"
              >
                clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-2 font-mono text-xs text-[#666]">
        {filtered.length} article{filtered.length !== 1 ? 's' : ''} found
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[#333] bg-[#111] p-8 text-center font-mono">
          <p className="text-[#666] text-sm">No articles match your search.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((article) => (
            <Link
              key={article.slug}
              to={`/articles/${article.slug}`}
              className="block border border-[#333] bg-[#0d0d0d] hover:bg-[#111] hover:border-[#555] transition-colors p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-white font-mono font-bold text-lg mb-1 hover:text-[#ff6b6b] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-[#888] text-sm mb-3 line-clamp-2">{article.description}</p>

                  {/* Content preview */}
                  {article.content && (
                    <div className="text-[#666] text-xs leading-relaxed mb-3 font-mono border-l-2 border-[#333] pl-3 line-clamp-3">
                      {article.content
                        .replace(/^#[^\n]*\n/gm, '')
                        .replace(/\*[^*]*\*/g, '')
                        .replace(/---/g, '')
                        .replace(/```[\s\S]*?```/g, '')
                        .replace(/\|[^\n]*\|/g, '')
                        .trim()
                        .slice(0, 300)}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs font-mono">
                    {article.date && <span className="text-[#666]">{article.date}</span>}
                    {article.author && <span className="text-[#555]">{article.author}</span>}
                  </div>
                </div>
                <span className="text-[#ff6b6b] font-mono text-sm flex-shrink-0 mt-1">&gt;</span>
              </div>
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {article.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-[#888] text-xs font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
