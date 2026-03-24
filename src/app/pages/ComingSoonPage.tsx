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
        <h1 className="text-2xl font-bold text-[var(--accent)] mb-2">Coming Soon...</h1>
        <p className="text-[var(--text-tertiary)] text-sm">What we're building next for Nanosandbox.</p>
      </div>

      {posts.length === 0 ? (
        <div className="border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] p-8 text-center font-mono">
          <p className="text-[var(--text-muted)] text-sm">No announcements yet. Check back soon.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-2 md:left-4 top-0 bottom-0 w-px bg-[var(--border-secondary)]" />

          <div className="space-y-8">
            {posts.map((post, i) => (
              <div key={post.slug} className="relative pl-8 md:pl-12">
                {/* Timeline dot */}
                <div className={`absolute left-0.5 md:left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                  i === 0 ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--bg-primary)] border-[var(--text-muted)]'
                }`} />

                {/* Content card */}
                <div className="border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-5">
                  <Link
                    to={`/coming-soon/${post.slug}`}
                    className="block group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h2 className="text-[var(--text-heading)] font-mono font-bold text-lg group-hover:text-[var(--accent)] transition-colors">
                        {post.title}
                      </h2>
                      <span className="text-[var(--accent)] font-mono text-sm flex-shrink-0 mt-1">&gt;</span>
                    </div>
                  </Link>

                  {post.description && (
                    <p className="text-[var(--text-secondary)] text-sm mb-3 leading-relaxed">{post.description}</p>
                  )}

                  {post.content && (
                    <div className="text-[var(--text-tertiary)] text-xs leading-relaxed mb-3 font-mono border-l-2 border-[var(--border-secondary)] pl-3">
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
                        <span key={tag} className="px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-secondary)] text-[var(--text-tertiary)] text-xs font-mono">
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
