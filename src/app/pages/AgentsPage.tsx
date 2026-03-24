import { useState, useMemo, useCallback } from 'react'
import { MobileDetailPanel } from '../components/mobile-detail-panel'
import agentsRegistry from '@/data/agents-registry.json'
import mcpData from '@/data/mcp-registry.json'
import localSkillsData from '@/data/skills-local.json'
import publicSkillsData from '@/data/skills-public.json'

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

interface AgentRegistryData {
  models: Record<string, { models: string[] }>
}

const registry = agentsRegistry as AgentRegistryData
const mcpServers = mcpData as McpServer[]
const registrySkills = localSkillsData as LocalSkill[]
const publicSkills = publicSkillsData as PublicSkill[]

// Combine all skills for selection
const allAvailableSkills = [
  ...registrySkills.map((s) => ({ name: s.name, description: s.description, tags: s.tags, source: 'registry' as const })),
  ...publicSkills.map((s) => ({ name: s.name, description: s.description, tags: s.tags, source: 'public' as const })),
]

const AGENTS = [
  { id: 'claude', label: 'Claude Code', icon: '>' },
  { id: 'cursor', label: 'Cursor', icon: '>' },
  { id: 'codex', label: 'Codex', icon: '>' },
  { id: 'goose', label: 'Goose', icon: '>' },
]

const ENV_VAR_MAP: Record<string, string> = {
  claude: 'ANTHROPIC_API_KEY',
  cursor: 'CURSOR_API_KEY',
  codex: 'OPENAI_API_KEY',
  goose: 'OPENAI_API_KEY',
}

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
    const envVar = ENV_VAR_MAP[selectedAgent] || 'API_KEY'
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
      lines.push(`    model: ${selectedModel}`)
    }

    lines.push(`    env:`)
    lines.push(`      ${envVar}: \${${envVar}}`)

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
        <div className="mb-6 font-mono">
          <h1 className="text-2xl font-bold text-[var(--accent)] mb-2">Agent Configurator</h1>
          <p className="text-[var(--text-tertiary)] text-sm">
            Configure an AI coding agent with MCP servers and skills, then generate a sandbox.yml.
          </p>
        </div>

        {/* Step 1: Select Agent */}
        <div className="mb-6 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4 font-mono">
          <h2 className="text-sm font-bold text-[var(--accent)] mb-3">1. Select Agent</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                <span className="text-sm font-bold">{agent.label}</span>
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
