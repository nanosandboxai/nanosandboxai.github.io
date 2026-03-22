import { Link } from 'react-router'
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

export default function ComingSoonPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 font-mono">
        <h1 className="text-2xl font-bold text-[#ff6b6b] mb-2">Coming Soon...</h1>
        <p className="text-[#888] text-sm">What we're building next for Nanosandbox.</p>
      </div>

      {posts.length === 0 ? (
        <div className="border border-[#333] bg-[#111] p-8 text-center font-mono">
          <p className="text-[#666] text-sm">No announcements yet. Check back soon.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-[#333]" />

          <div className="space-y-8">
            {posts.map((post, i) => (
              <div key={post.slug} className="relative pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                  i === 0 ? 'bg-[#ff6b6b] border-[#ff6b6b]' : 'bg-[#0a0a0a] border-[#555]'
                }`} />

                {/* Content card */}
                <div className="border border-[#333] bg-[#0d0d0d] p-5">
                  <Link
                    to={`/coming-soon/${post.slug}`}
                    className="block group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-white font-mono font-bold text-lg group-hover:text-[#ff6b6b] transition-colors">
                        {post.title}
                      </h2>
                      <span className="text-[#ff6b6b] font-mono text-sm flex-shrink-0 mt-1">&gt;</span>
                    </div>
                  </Link>

                  {post.description && (
                    <p className="text-[#b0b0b0] text-sm mb-3 leading-relaxed">{post.description}</p>
                  )}

                  {post.content && (
                    <div className="text-[#777] text-xs leading-relaxed mb-3 font-mono border-l-2 border-[#333] pl-3">
                      {post.content
                        .replace(/^#[^\n]*\n/gm, '')
                        .replace(/\*[^*]*\*/g, '')
                        .replace(/---/g, '')
                        .replace(/```[\s\S]*?```/g, '')
                        .trim()
                        .slice(0, 200)}
                      {post.content.length > 200 ? '...' : ''}
                    </div>
                  )}

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] text-[#888] text-xs font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
