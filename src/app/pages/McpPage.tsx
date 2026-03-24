import { useState, useMemo, useCallback } from 'react'
import { MobileDetailPanel } from '../components/mobile-detail-panel'
import mcpData from '@/data/mcp-registry.json'

interface McpServer {
  name: string
  title: string
  description: string
  version: string
  websiteUrl: string | null
  repositoryUrl: string | null
}

const servers = mcpData as McpServer[]

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

export default function McpPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<McpServer>(servers[0] ?? null)

  const filtered = useMemo(() => {
    if (!search) return servers
    const q = search.toLowerCase()
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
    )
  }, [search])

  const yamlConfig = useMemo(() => {
    if (!selected) return ''
    return `sandboxes:
  claude:
    image: claude
    mcp:
      ${selected.name}:
        command: npx
        args: ["-y", "${selected.name}"]`
  }, [selected])

  return (
    <div>
      <div className="mb-6 font-mono">
        <h1 className="text-2xl font-bold text-[var(--accent)] mb-2">MCP Servers</h1>
        <p className="text-[var(--text-tertiary)] text-sm">
          {servers.length} servers from{' '}
          <a
            href="https://registry.modelcontextprotocol.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            registry.modelcontextprotocol.io
          </a>
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--accent)] font-mono text-sm">$</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="grep -i 'search servers...'"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-heading)] font-mono text-sm px-3 py-2 pl-7 placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>
        <div className="mt-2 font-mono text-xs text-[var(--text-muted)]">
          {filtered.length} server{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Server list */}
        <div className="flex-1 min-w-0">
          <div className="grid gap-2">
            {filtered.slice(0, 80).map((server) => (
              <button
                key={server.name}
                onClick={() => setSelected(server)}
                className={`border p-3 font-mono text-left transition-colors ${
                  selected?.name === server.name
                    ? 'border-[var(--accent)] bg-[var(--bg-selected)]'
                    : 'border-[var(--border-secondary)] bg-[var(--bg-secondary)] hover:border-[var(--text-muted)]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[var(--text-heading)] text-sm font-bold truncate">{server.title || server.name}</h3>
                  {server.version && (
                    <span className="text-[var(--text-muted)] text-xs flex-shrink-0">v{server.version}</span>
                  )}
                </div>
                <p className="text-[var(--text-tertiary)] text-xs leading-relaxed line-clamp-2">{server.description}</p>
              </button>
            ))}
          </div>

          {filtered.length > 80 && (
            <div className="mt-4 text-center font-mono text-xs text-[var(--text-muted)]">
              Showing 80 of {filtered.length} servers. Use search to narrow results.
            </div>
          )}
        </div>

        {/* Right panel */}
        <MobileDetailPanel triggerLabel="view config" hasContent={!!selected}>
          <div className="border border-[var(--accent)] bg-[var(--bg-secondary)] p-4 font-mono">
            {selected ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[var(--accent)] text-lg font-bold truncate">{selected.title || selected.name}</h3>
                </div>

                <p className="text-[var(--text-secondary)] text-sm mb-4 leading-relaxed">{selected.description}</p>

                {/* Links */}
                <div className="flex gap-3 mb-4">
                  {selected.repositoryUrl && (
                    <a href={selected.repositoryUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] text-xs hover:underline">
                      repo
                    </a>
                  )}
                  {selected.websiteUrl && (
                    <a href={selected.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] text-xs hover:underline">
                      website
                    </a>
                  )}
                </div>

                {/* How to run in nanosandbox */}
                <div className="border-t border-[var(--border-secondary)] pt-4">
                  <h4 className="text-[var(--text-heading)] text-sm font-bold mb-3">$ Run in Nanosandbox</h4>

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
                      <p className="text-[var(--text-tertiary)] text-xs mb-1"># Or use the TUI</p>
                      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] p-3 text-xs space-y-1">
                        <div className="text-[var(--text-primary)]">nanosb</div>
                        <div className="text-[var(--text-primary)]">/mcp add {selected.name} npx -y {selected.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[var(--text-muted)] text-sm text-center py-8">
                Select a server to see configuration
              </div>
            )}
          </div>
        </MobileDetailPanel>
      </div>
    </div>
  )
}
