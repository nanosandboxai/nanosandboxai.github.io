import { useState, useMemo, useCallback } from 'react'
import PageHero from '@/app/components/page-hero'
import { MobileDetailPanel } from '../components/mobile-detail-panel'
import agentsRegistry from '@data/agents-registry.json'
import mcpData from '@data/mcp-registry.json'
import localSkillsData from '@data/skills-local.json'
import publicSkillsData from '@data/skills-public.json'

interface McpServer {
  name: string
  title: string
  description: string
  version: string
  websiteUrl: string | null
  repositoryUrl: string | null
}

interface LocalSkill {
  name: string
  description: string
  tags: string[]
  path: string
}

interface PublicSkill {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  sourceUrl: string | null
  owner: string
}

interface AgentRule {
  mode?: 'single' | 'collapse' | 'derived'
  case_sensitive?: boolean
  default?: string | null
  alt?: string[]
  collapse?: Record<string, string>
  collapse_default?: string | null
  overrides?: Record<string, string[] | { keys?: string[]; oauth?: boolean }>
  no_env?: string[]
  extra_keys?: string[]
  providers?: string[]
  accepted_keys?: string[]
}

interface ProviderCatalog {
  canonical: Record<string, string>
  credentials: Record<string, string[]>
  agents: Record<string, AgentRule>
}

interface ResolvedCredential {
  provider: string | null
  keys: string[]
  oauth: boolean
}

interface AgentRegistryData {
  models: Record<string, { models: string[] }>
  providerCatalog?: ProviderCatalog
}

const registry = agentsRegistry as AgentRegistryData
const mcpServers = mcpData as McpServer[]
const registrySkills = localSkillsData as LocalSkill[]
const publicSkills = publicSkillsData as PublicSkill[]

// Provider resolution mirroring the product scripts/models/providers.py `resolve`.

function normalizePrefix(prefix: string): string {
  return prefix.split(':', 1)[0].toLowerCase()
}

function canonicalProvider(prefix: string, canonical: Record<string, string>): string {
  const normalized = normalizePrefix(prefix)
  return canonical[normalized] ?? normalized
}

function overrideSpec(spec: string[] | { keys?: string[]; oauth?: boolean }): { keys: string[]; oauth: boolean } {
  if (Array.isArray(spec)) return { keys: spec, oauth: false }
  return { keys: spec.keys ?? [], oauth: spec.oauth ?? false }
}

function providerCredential(provider: string, catalog: ProviderCatalog): ResolvedCredential {
  const creds = catalog.credentials[provider]
  const keys = creds ?? []
  return { provider, keys: [...keys], oauth: provider in catalog.credentials && keys.length === 0 }
}

function resolveProvider(agent: string, model: string, catalog: ProviderCatalog): ResolvedCredential | null {
  const rule = catalog.agents[agent]
  if (!rule) return null
  const mode = rule.mode ?? 'derived'
  const alt = rule.alt ?? []
  const seg = model.includes('/') ? model.split('/', 1)[0] : ''

  if (seg === '') {
    let def = rule.default ?? null
    if (def == null && mode === 'collapse') def = rule.collapse_default ?? null
    if (def == null) return { provider: null, keys: [...alt], oauth: false }
    const cred = providerCredential(def, catalog)
    return { ...cred, keys: [...cred.keys, ...alt] }
  }

  if (mode === 'collapse') {
    const collapse = rule.collapse ?? {}
    const key = rule.case_sensitive ? seg : seg.toLowerCase()
    const provider = collapse[key] ?? rule.collapse_default ?? null
    if (provider == null) return null
    return providerCredential(provider, catalog)
  }

  const canon = canonicalProvider(seg, catalog.canonical)
  const overrides = rule.overrides ?? {}
  const segKey = rule.case_sensitive ? seg : seg.toLowerCase()
  if (segKey in overrides) {
    const { keys, oauth } = overrideSpec(overrides[segKey])
    return { provider: null, keys, oauth }
  }
  if (canon in overrides) {
    const { keys, oauth } = overrideSpec(overrides[canon])
    return { provider: null, keys, oauth }
  }
  if ((rule.no_env ?? []).includes(canon)) return { provider: canon, keys: [], oauth: true }
  if (mode === 'derived' || (rule.providers ?? []).includes(canon)) {
    if (canon in catalog.credentials || (rule.no_env ?? []).includes(canon)) {
      return providerCredential(canon, catalog)
    }
    return null
  }
  return null
}

// GOOSE_MODEL keeps the full string for openrouter/gateway providers and strips
// the prefix for first-party ones, matching the product resolve_goose_env.
function gooseModelValue(provider: string, model: string): string {
  if (provider === 'openrouter') return model
  if (provider === 'anthropic' || provider === 'openai' || provider === 'google') {
    const idx = model.indexOf('/')
    return idx === -1 ? model : model.slice(idx + 1)
  }
  return model
}

function buildEnvBlock(
  agent: string,
  model: string,
  catalog: ProviderCatalog
): { lines: string[]; oauthComment?: string } | null {
  const rule = catalog.agents[agent]
  const resolved = resolveProvider(agent, model, catalog)
  if (!resolved) return null
  const alt = rule?.alt ?? []
  const primaryKeys = resolved.keys.filter((k) => !alt.includes(k))

  if (resolved.oauth && primaryKeys.length === 0) {
    return {
      lines: [],
      oauthComment: `# OAuth provider (${resolved.provider}); authenticate inside the agent; no env var.`,
    }
  }

  const lines: string[] = []
  if (agent === 'goose' && resolved.provider) {
    lines.push(`      GOOSE_PROVIDER: "${resolved.provider}"`)
    lines.push(`      GOOSE_MODEL: "${gooseModelValue(resolved.provider, model)}"`)
  }
  for (const key of primaryKeys) {
    lines.push(`      ${key}: \${${key}}`)
  }
  if (alt.length > 0 && primaryKeys.length > 0) {
    lines.push(`      # Alternative: ${alt.join(', ')}`)
  }
  return { lines }
}

// Combine all skills for selection
const allAvailableSkills = [
  ...registrySkills.map((s) => ({ name: s.name, description: s.description, tags: s.tags, source: 'registry' as const })),
  ...publicSkills.map((s) => ({ name: s.name, description: s.description, tags: s.tags, source: 'public' as const })),
]

// Preferred display order; unknown catalog keys are appended after these.
const AGENT_ORDER = [
  'claude',
  'goose',
  'codex',
  'cursor',
  'opencode',
  'aider',
  'gemini',
  'crush',
  'oh-my-openagent',
  'oh-my-codex',
  'oh-my-claude',
]

const AGENT_META: Record<string, { label: string; envVar: string }> = {
  claude: { label: 'Claude Code', envVar: 'ANTHROPIC_API_KEY' },
  goose: { label: 'Goose', envVar: 'OPENAI_API_KEY' },
  codex: { label: 'Codex', envVar: 'OPENAI_API_KEY' },
  cursor: { label: 'Cursor', envVar: 'CURSOR_API_KEY' },
  opencode: { label: 'OpenCode', envVar: 'ANTHROPIC_API_KEY' },
  aider: { label: 'Aider', envVar: 'OPENAI_API_KEY' },
  gemini: { label: 'Gemini CLI', envVar: 'GEMINI_API_KEY' },
  crush: { label: 'Crush', envVar: 'OPENAI_API_KEY' },
  'oh-my-openagent': { label: 'Oh-My-OpenAgent', envVar: 'OPENAI_API_KEY' },
  'oh-my-codex': { label: 'Oh-My-Codex', envVar: 'OPENAI_API_KEY' },
  'oh-my-claude': { label: 'Oh-My-Claude', envVar: 'ANTHROPIC_API_KEY' },
}

const catalogAgentIds = Object.keys(registry.models ?? {})
const orderedIds = AGENT_ORDER.filter((id) => catalogAgentIds.includes(id))
const unknownIds = catalogAgentIds.filter((id) => !AGENT_ORDER.includes(id))
const agentIds = orderedIds.length > 0 ? [...orderedIds, ...unknownIds] : [...AGENT_ORDER]

const AGENTS = agentIds.map((id) => ({
  id,
  label: AGENT_META[id]?.label ?? id,
  icon: '>',
}))

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

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedMcps, setSelectedMcps] = useState<Set<string>>(new Set())
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set())
  const [mcpSearch, setMcpSearch] = useState('')
  const [skillSearch, setSkillSearch] = useState('')

  const models = useMemo(() => {
    if (!selectedAgent) return []
    return registry.models?.[selectedAgent]?.models ?? []
  }, [selectedAgent])

  const filteredMcps = useMemo(() => {
    if (!mcpSearch) return mcpServers.slice(0, 30)
    const q = mcpSearch.toLowerCase()
    return mcpServers
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      )
      .slice(0, 30)
  }, [mcpSearch])

  const filteredSkills = useMemo(() => {
    if (!skillSearch) return allAvailableSkills.slice(0, 40)
    const q = skillSearch.toLowerCase()
    return allAvailableSkills
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 40)
  }, [skillSearch])

  const toggleMcp = (name: string) => {
    setSelectedMcps((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const toggleSkill = (name: string) => {
    setSelectedSkills((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const selectAgent = (id: string) => {
    setSelectedAgent(id)
    setSelectedModel('')
  }

  const generatedYaml = useMemo(() => {
    if (!selectedAgent) return ''
    const agentDef = AGENTS.find((a) => a.id === selectedAgent)
    const lines: string[] = [
      `# Nanosandbox agent configuration`,
      `# Generated for ${agentDef?.label ?? selectedAgent}`,
      ``,
      `defaults:`,
      `  cpus: 2`,
      `  memory: 4096`,
      `  timeout: 600`,
      ``,
      `sandboxes:`,
      `  ${selectedAgent}:`,
      `    image: ${selectedAgent}`,
      `    type: ${selectedAgent}`,
    ]

    if (selectedModel) {
      lines.push(`    model: ${JSON.stringify(selectedModel)}`)
    }

    const catalog = registry.providerCatalog
    let envBlock: { lines: string[]; oauthComment?: string } | null = null
    if (selectedModel && catalog?.agents?.[selectedAgent]) {
      envBlock = buildEnvBlock(selectedAgent, selectedModel, catalog)
    }

    if (envBlock && envBlock.lines.length > 0) {
      lines.push(`    env:`)
      lines.push(...envBlock.lines)
    } else if (envBlock?.oauthComment) {
      lines.push(`    ${envBlock.oauthComment}`)
    } else {
      const envVar = AGENT_META[selectedAgent]?.envVar ?? 'API_KEY'
      lines.push(`    env:`)
      lines.push(`      ${envVar}: \${${envVar}}`)
    }

    if (selectedSkills.size > 0) {
      lines.push(`    skills:`)
      for (const name of selectedSkills) {
        lines.push(`      - ${name}`)
      }
    }

    if (selectedMcps.size > 0) {
      lines.push(`    mcp:`)
      for (const name of selectedMcps) {
        lines.push(`      ${name}:`)
        lines.push(`        command: npx`)
        lines.push(`        args: ["-y", "${name}"]`)
      }
    }

    return lines.join('\n')
  }, [selectedAgent, selectedModel, selectedMcps, selectedSkills])

  const configCount = (selectedAgent ? 1 : 0) + (selectedModel ? 1 : 0) + selectedMcps.size + selectedSkills.size

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Left: configurator */}
      <div className="flex-1 min-w-0">
        <PageHero
          command="nanosb init --agent"
          title="Pick an agent."
          accent="We build the cell."
          description={<p>Configure an AI coding agent with MCP servers and skills, then generate a sandbox.yml.</p>}
        />

        {/* Step 1: Select Agent */}
        <div className="mb-6 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
          <h2 className="text-sm font-bold text-[var(--accent)] mb-3">1. Select Agent</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent.id)}
                className={`border p-3 text-left transition-colors ${
                  selectedAgent === agent.id
                    ? 'border-[var(--accent)] bg-[var(--bg-selected)] text-[var(--text-heading)]'
                    : 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:border-[var(--text-muted)] hover:text-[var(--text-heading)]'
                }`}
              >
                <span className="text-[var(--accent)] mr-1">{agent.icon}</span>
                <span className="text-sm font-bold leading-tight break-words">{agent.label}</span>
                {registry.models?.[agent.id] && (
                  <div className="text-[var(--text-muted)] text-xs mt-1">
                    {registry.models[agent.id].models?.length ?? 0} models
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {selectedAgent && (
          <>
            {/* Step 2: Select Model */}
            <div className="mb-6 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
              <h2 className="text-sm font-bold text-[var(--accent)] mb-3">2. Select Model</h2>
              {models.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {models.map((model) => (
                    <button
                      key={model}
                      onClick={() => setSelectedModel(selectedModel === model ? '' : model)}
                      className={`px-2 py-0.5 text-xs border transition-colors ${
                        selectedModel === model
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--text-muted)] hover:text-[var(--text-heading)]'
                      }`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[var(--text-muted)] text-xs">No models available for this agent.</p>
              )}
            </div>

            {/* Step 3: Select MCPs */}
            <div className="mb-6 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
              <h2 className="text-sm font-bold text-[var(--accent)] mb-3">
                3. Select MCP Servers
                {selectedMcps.size > 0 && (
                  <span className="text-[var(--text-tertiary)] font-normal ml-2">({selectedMcps.size} selected)</span>
                )}
              </h2>

              <div className="relative mb-3">
                <input
                  type="text"
                  value={mcpSearch}
                  onChange={(e) => setMcpSearch(e.target.value)}
                  placeholder="search mcp servers..."
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-heading)] text-xs px-3 py-1.5 placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              {selectedMcps.size > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.from(selectedMcps).map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleMcp(name)}
                      className="px-2 py-0.5 text-xs bg-[var(--accent)] text-black border border-[var(--accent)]"
                    >
                      {name} x
                    </button>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {filteredMcps.map((server) => (
                  <button
                    key={server.name}
                    onClick={() => toggleMcp(server.name)}
                    className={`border p-2 text-left text-xs transition-colors ${
                      selectedMcps.has(server.name)
                        ? 'border-[var(--accent)] bg-[var(--bg-selected)]'
                        : 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <span className="text-[var(--text-heading)] font-bold">{server.title || server.name}</span>
                    <p className="text-[var(--text-tertiary)] line-clamp-1 mt-0.5">{server.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 4: Select Skills */}
            <div className="mb-20 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
              <h2 className="text-sm font-bold text-[var(--accent)] mb-3">
                4. Select Skills
                {selectedSkills.size > 0 && (
                  <span className="text-[var(--text-tertiary)] font-normal ml-2">({selectedSkills.size} selected)</span>
                )}
              </h2>

              <div className="relative mb-3">
                <input
                  type="text"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="search skills..."
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] text-[var(--text-heading)] text-xs px-3 py-1.5 placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                />
              </div>

              {selectedSkills.size > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.from(selectedSkills).map((name) => (
                    <button
                      key={name}
                      onClick={() => toggleSkill(name)}
                      className="px-2 py-0.5 text-xs bg-[var(--accent)] text-black border border-[var(--accent)]"
                    >
                      {name} x
                    </button>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto">
                {filteredSkills.map((skill, idx) => (
                  <button
                    key={`${skill.source}-${skill.name}-${idx}`}
                    onClick={() => toggleSkill(skill.name)}
                    className={`border p-2 text-left text-xs transition-colors ${
                      selectedSkills.has(skill.name)
                        ? 'border-[var(--accent)] bg-[var(--bg-selected)]'
                        : 'border-[var(--border-secondary)] bg-[var(--bg-tertiary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[var(--text-heading)] font-bold truncate">{skill.name}</span>
                      <span className={`text-[10px] flex-shrink-0 px-1 border ${
                        skill.source === 'registry'
                          ? 'text-[#ff6b6b] border-[#ff6b6b]/30'
                          : 'text-[var(--text-muted)] border-[var(--border-secondary)]'
                      }`}>
                        {skill.source}
                      </span>
                    </div>
                    <p className="text-[var(--text-tertiary)] line-clamp-1 mt-0.5">{skill.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right: YAML panel */}
      <MobileDetailPanel triggerLabel="sandbox.yml" hasContent={!!generatedYaml}>
        <div className="border border-[var(--accent)] bg-[var(--bg-secondary)] p-4 font-mono">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[var(--accent)] text-lg font-bold">sandbox.yml</h3>
            {generatedYaml && <CopyButton text={generatedYaml} />}
          </div>

          {generatedYaml ? (
            <>
              <pre className="text-[var(--text-primary)] text-xs leading-relaxed whitespace-pre-wrap mb-4">{generatedYaml}</pre>

              <div className="border-t border-[var(--border-secondary)] pt-3">
                <p className="text-[var(--text-tertiary)] text-xs mb-2"># Save as sandbox.yml and launch:</p>
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] p-2 text-xs space-y-1">
                  <div className="text-[var(--text-primary)]">nanosb</div>
                </div>
              </div>

              <div className="border-t border-[var(--border-secondary)] pt-3 mt-3">
                <p className="text-[var(--text-tertiary)] text-xs mb-2"># Or run a single sandbox:</p>
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] p-2 text-xs space-y-1">
                  <div className="text-[var(--text-primary)]">nanosb --sandbox {selectedAgent}</div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-[var(--text-muted)] text-sm text-center py-12">
              Select an agent to generate<br />sandbox.yml configuration
            </div>
          )}
        </div>
      </MobileDetailPanel>
    </div>
  )
}
