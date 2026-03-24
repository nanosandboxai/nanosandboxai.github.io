import { useState, useMemo, useCallback } from 'react'
import { MobileDetailPanel } from '../components/mobile-detail-panel'
import publicSkillsData from '@/data/skills-public.json'
import localSkillsData from '@/data/skills-local.json'

interface PublicSkill {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  sourceUrl: string | null
  owner: string
}

interface LocalSkill {
  name: string
  description: string
  tags: string[]
  path: string
}

interface UnifiedSkill {
  id: string
  name: string
  description: string
  tags: string[]
  source: 'public' | 'registry'
  category: string
  sourceUrl: string | null
  owner: string
}

const publicSkills = publicSkillsData as PublicSkill[]
const localSkills = localSkillsData as LocalSkill[]

const allSkills: UnifiedSkill[] = [
  ...localSkills.map((s) => ({
    id: `local-${s.name}`,
    name: s.name,
    description: s.description,
    tags: s.tags,
    source: 'registry' as const,
    category: '',
    sourceUrl: null,
    owner: '',
  })),
  ...publicSkills.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    tags: s.tags,
    source: 'public' as const,
    category: s.category,
    sourceUrl: s.sourceUrl,
    owner: s.owner,
  })),
]

const allCategories = Array.from(new Set(publicSkills.map((s) => s.category).filter(Boolean))).sort()

type SourceFilter = 'all' | 'public' | 'registry'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--text-tertiary)] text-xs hover:text-[var(--text-heading)] transition-colors"
    >
      {copied ? '[copied!]' : '[copy]'}
    </button>
  )
}

export default function SkillPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [selected, setSelected] = useState<UnifiedSkill>(allSkills[0] ?? null)

  const filtered = useMemo(() => {
    return allSkills.filter((skill) => {
      const matchesSearch =
        !search ||
        skill.name.toLowerCase().includes(search.toLowerCase()) ||
        skill.description.toLowerCase().includes(search.toLowerCase()) ||
        skill.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory = !selectedCategory || skill.category === selectedCategory
      const matchesSource = sourceFilter === 'all' || skill.source === sourceFilter

      return matchesSearch && matchesCategory && matchesSource
    })
  }, [search, selectedCategory, sourceFilter])

  const yamlConfig = useMemo(() => {
    if (!selected) return ''
    return `sandboxes:
  claude:
    image: claude
    skills:
      - ${selected.name}`
  }, [selected])

  return (
    <div>
      <div className="mb-6 font-mono">
        <h1 className="text-2xl font-bold text-[var(--accent)] mb-2">Skills</h1>
        <p className="text-[var(--text-tertiary)] text-sm">
          {allSkills.length} skills available — {publicSkills.length} public, {localSkills.length} from registry.
        </p>
      </div>

      {/* Search and filters */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-mono text-sm">$</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="grep -i 'search skills...'"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-heading)] font-mono text-sm px-3 py-2 pl-7 placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'public', 'registry'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-2 py-0.5 text-xs font-mono border transition-colors ${
                sourceFilter === f
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              {f}
            </button>
          ))}

          <span className="text-[var(--border-secondary)] mx-1">|</span>

          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-2 py-0.5 text-xs font-mono border transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              {cat.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="font-mono text-xs text-[var(--text-muted)]">
          {filtered.length} skill{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Skills grid */}
        <div className="flex-1 min-w-0">
          <div className="grid gap-2">
            {filtered.slice(0, 80).map((skill) => (
              <button
                key={skill.id}
                onClick={() => setSelected(skill)}
                className={`border p-3 font-mono text-left transition-colors ${
                  selected?.id === skill.id
                    ? 'border-[var(--accent)] bg-[var(--bg-selected)]'
                    : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[var(--text-heading)] text-sm font-bold truncate">{skill.name}</h3>
                  <span className={`text-xs flex-shrink-0 px-1.5 py-0.5 border ${
                    skill.source === 'registry'
                      ? 'text-[#ff6b6b] border-[#ff6b6b]/30 bg-[#ff6b6b]/5'
                      : 'text-[var(--text-muted)] border-[var(--border-secondary)] bg-[var(--bg-elevated)]'
                  }`}>
                    {skill.source}
                  </span>
                </div>
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed line-clamp-2">{skill.description}</p>
                {skill.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {skill.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-secondary)] text-[var(--text-muted)] text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {filtered.length > 80 && (
            <div className="mt-4 text-center font-mono text-xs text-[var(--text-muted)]">
              Showing 80 of {filtered.length} skills. Use search to narrow results.
            </div>
          )}
        </div>

        {/* Right panel */}
        <MobileDetailPanel triggerLabel="view config" hasContent={!!selected}>
          <div className="border border-[var(--accent)] bg-[var(--bg-secondary)] p-4 font-mono">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[var(--accent)] text-lg font-bold truncate">{selected.name}</h3>
                </div>

                <p className="text-[var(--text-secondary)] text-sm mb-3 leading-relaxed">{selected.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-1.5 py-0.5 border ${
                    selected.source === 'registry'
                      ? 'text-[#ff6b6b] border-[#ff6b6b]/30 bg-[#ff6b6b]/5'
                      : 'text-[var(--text-muted)] border-[var(--border-secondary)] bg-[var(--bg-elevated)]'
                  }`}>
                    {selected.source}
                  </span>
                  {selected.category && (
                    <span className="text-[var(--text-muted)] text-xs">{selected.category}</span>
                  )}
                  {selected.sourceUrl && (
                    <a href={selected.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] text-xs hover:underline">
                      source
                    </a>
                  )}
                  {selected.owner && (
                    <span className="text-[var(--text-muted)] text-xs">@{selected.owner}</span>
                  )}
                </div>

                {selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-secondary)] text-[var(--text-muted)] text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* How to configure in nanosandbox */}
                <div className="border-t border-[var(--border-secondary)] pt-4">
                  <h4 className="text-[var(--text-heading)] text-sm font-bold mb-3">$ Configure in Nanosandbox</h4>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[var(--text-tertiary)] text-xs"># Add to sandbox.yml</p>
                        <CopyButton text={yamlConfig} />
                      </div>
                      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] p-3 text-xs">
                        <pre className="text-[var(--text-primary)] whitespace-pre-wrap">{yamlConfig}</pre>
                      </div>
                    </div>

                    <div>
                      <p className="text-[var(--text-tertiary)] text-xs mb-1"># Or via the TUI</p>
                      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] p-3 text-xs space-y-1">
                        <div className="text-[var(--text-primary)]">nanosb</div>
                        <div className="text-[var(--text-primary)]">/skills add {selected.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[var(--text-muted)] text-sm text-center py-8">
                Select a skill to see configuration
              </div>
            )}
          </div>
        </MobileDetailPanel>
      </div>
    </div>
  )
}
