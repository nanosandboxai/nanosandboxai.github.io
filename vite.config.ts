import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs/promises'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

const MCP_REGISTRY_API = 'https://registry.modelcontextprotocol.io/v0/servers'
const MCP_REGISTRY_OUTPUT = path.resolve(__dirname, 'src/data/mcp-registry.json')
const PUBLIC_SKILLS_API = 'https://openskills.space/api/skills'
const PUBLIC_SKILLS_OUTPUT = path.resolve(__dirname, 'src/data/skills-public.json')
const LOCAL_SKILLS_INDEX = path.resolve(__dirname, '../agents-registry/index.json')
const LOCAL_SKILLS_OUTPUT = path.resolve(__dirname, 'src/data/skills-local.json')
const AGENTS_REGISTRY_DIR = path.resolve(__dirname, '../agents-registry')
const AGENTS_OUTPUT = path.resolve(__dirname, 'src/data/agents-registry.json')

const ARTICLES_DIR = path.resolve(__dirname, '../articles/articles')
const COMING_SOON_DIR = path.resolve(__dirname, '../articles/coming-soon')
const ARTICLES_OUTPUT = path.resolve(__dirname, 'src/data/articles.json')
const COMING_SOON_OUTPUT = path.resolve(__dirname, 'src/data/coming-soon.json')
const DOCS_CONTENT_DIR = path.resolve(__dirname, 'content/docs')
const DOCS_MANIFEST_OUTPUT = path.resolve(__dirname, 'src/data/docs-manifest.json')
const DOCS_CONTENT_OUTPUT = path.resolve(__dirname, 'src/data/docs-content.json')

interface RegistryEntry {
  server: {
    name?: string
    title?: string
    description?: string
    version?: string
    websiteUrl?: string
    repository?: { url?: string }
  }
  _meta?: {
    'io.modelcontextprotocol.registry/official'?: {
      isLatest?: boolean
      status?: string
    }
  }
}

interface PublicSkillEntry {
  id?: string
  name?: string
  description?: string
  category?: string
  tags?: string[]
  sourceUrl?: string
  owner?: string
}

interface LocalSkillsIndex {
  skills?: Array<{
    name?: string
    description?: string
    tags?: string[]
    path?: string
  }>
}

function mcpRegistryPlugin(): Plugin {
  return {
    name: 'fetch-mcp-registry',
    async buildStart() {
      try {
        const allServers: RegistryEntry[] = []
        let cursor: string | undefined

        while (true) {
          const url = cursor ? `${MCP_REGISTRY_API}?cursor=${encodeURIComponent(cursor)}` : MCP_REGISTRY_API
          const res = await fetch(url)
          if (!res.ok) {
            console.warn(`[mcp-registry] API returned ${res.status}, using cached data if available`)
            break
          }
          const data = await res.json()
          if (data.servers) allServers.push(...data.servers)
          if (data.metadata?.nextCursor) {
            cursor = data.metadata.nextCursor
          } else {
            break
          }
        }

        const seen = new Map<string, (typeof trimmed)[number]>()
        const trimmed = allServers
          .filter((entry) => {
            const meta = entry._meta?.['io.modelcontextprotocol.registry/official']
            return meta?.isLatest === true && meta?.status === 'active'
          })
          .map((entry) => ({
            name: entry.server.name ?? '',
            title: entry.server.title || entry.server.name || '',
            description: entry.server.description ?? '',
            version: entry.server.version ?? '',
            websiteUrl: entry.server.websiteUrl ?? null,
            repositoryUrl: entry.server.repository?.url ?? null,
          }))

        for (const item of trimmed) {
          if (item.name && !seen.has(item.name)) {
            seen.set(item.name, item)
          }
        }

        const result = Array.from(seen.values())
        await fs.writeFile(MCP_REGISTRY_OUTPUT, JSON.stringify(result, null, 2))
        console.log(`[mcp-registry] Fetched ${result.length} servers from official registry`)
      } catch (err) {
        console.warn('[mcp-registry] Failed to fetch registry, build continues with cached data:', err)
      }
    },
  }
}

function skillsRegistryPlugin(): Plugin {
  return {
    name: 'fetch-skills-registry',
    async buildStart() {
      try {
        await fs.mkdir(path.resolve(__dirname, 'src/data'), { recursive: true })

        const publicRes = await fetch(PUBLIC_SKILLS_API)
        if (publicRes.ok) {
          const publicData = await publicRes.json()
          const publicSkills = ((publicData.skills ?? []) as PublicSkillEntry[]).map((skill) => ({
            id: skill.id ?? '',
            name: skill.name ?? '',
            description: skill.description ?? '',
            category: skill.category ?? '',
            tags: skill.tags ?? [],
            sourceUrl: skill.sourceUrl ?? null,
            owner: skill.owner ?? '',
          }))

          await fs.writeFile(PUBLIC_SKILLS_OUTPUT, JSON.stringify(publicSkills, null, 2))
          console.log(`[skills-registry] Fetched ${publicSkills.length} public skills`)
        } else {
          console.warn(`[skills-registry] Public API returned ${publicRes.status}, using cached public skills if available`)
        }
      } catch (err) {
        console.warn('[skills-registry] Failed to fetch public skills, build continues with cached data:', err)
      }

      try {
        const localIndexRaw = await fs.readFile(LOCAL_SKILLS_INDEX, 'utf8')
        const localIndex = JSON.parse(localIndexRaw) as LocalSkillsIndex
        const localSkills = (localIndex.skills ?? []).map((skill) => ({
          name: skill.name ?? '',
          description: skill.description ?? '',
          tags: skill.tags ?? [],
          path: skill.path ?? '',
        }))

        await fs.writeFile(LOCAL_SKILLS_OUTPUT, JSON.stringify(localSkills, null, 2))
        console.log(`[skills-registry] Loaded ${localSkills.length} local skills`)
      } catch (err) {
        console.warn('[skills-registry] Failed to load local skills, build continues with cached data:', err)
      }
    },
  }
}

interface ArticleFrontmatter {
  title?: string
  type?: string
  date?: string
  description?: string
  tags?: string[]
  author?: string
}

interface DocFrontmatter {
  title?: string
  description?: string
  order?: number
}

interface SectionMeta {
  label?: string
  order?: number
}

async function parseFrontmatter(raw: string): Promise<{ data: Record<string, unknown>; content: string }> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }

  const yamlBlock = match[1]
  const content = match[2]
  const data: Record<string, unknown> = {}

  for (const line of yamlBlock.split('\n')) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    let value: unknown = line.slice(colonIndex + 1).trim()

    // Handle arrays like [a, b, c]
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
    }
    // Handle quoted strings
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }

    data[key] = value
  }

  return { data, content }
}

async function readMarkdownDir(dir: string): Promise<Array<{ slug: string; frontmatter: ArticleFrontmatter; content: string; filePath: string }>> {
  const results: Array<{ slug: string; frontmatter: ArticleFrontmatter; content: string; filePath: string }> = []
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      if (!file.endsWith('.md')) continue
      const filePath = path.join(dir, file)
      const raw = await fs.readFile(filePath, 'utf8')
      const { data, content } = await parseFrontmatter(raw)
      const slug = file.replace(/\.md$/, '')
      results.push({ slug, frontmatter: data as ArticleFrontmatter, content, filePath })
    }
  } catch {
    // Directory doesn't exist or is empty
  }
  return results
}

function articlesPlugin(): Plugin {
  return {
    name: 'fetch-articles',
    async buildStart() {
      await fs.mkdir(path.resolve(__dirname, 'src/data'), { recursive: true })

      try {
        const articles = await readMarkdownDir(ARTICLES_DIR)
        const articlesData = articles.map(({ slug, frontmatter, content }) => ({
          slug,
          title: frontmatter.title ?? slug,
          date: frontmatter.date ?? '',
          description: frontmatter.description ?? '',
          tags: frontmatter.tags ?? [],
          author: frontmatter.author ?? '',
          content,
        }))
        await fs.writeFile(ARTICLES_OUTPUT, JSON.stringify(articlesData, null, 2))
        console.log(`[articles] Loaded ${articlesData.length} articles`)
      } catch (err) {
        console.warn('[articles] Failed to load articles, build continues with cached data:', err)
      }

      try {
        const comingSoon = await readMarkdownDir(COMING_SOON_DIR)
        const comingSoonData = comingSoon.map(({ slug, frontmatter, content }) => ({
          slug,
          title: frontmatter.title ?? slug,
          date: frontmatter.date ?? '',
          description: frontmatter.description ?? '',
          tags: frontmatter.tags ?? [],
          author: frontmatter.author ?? '',
          content,
        }))
        await fs.writeFile(COMING_SOON_OUTPUT, JSON.stringify(comingSoonData, null, 2))
        console.log(`[articles] Loaded ${comingSoonData.length} coming-soon posts`)
      } catch (err) {
        console.warn('[articles] Failed to load coming-soon posts, build continues with cached data:', err)
      }
    },
  }
}

function docsPlugin(): Plugin {
  return {
    name: 'build-docs',
    async buildStart() {
      await fs.mkdir(path.resolve(__dirname, 'src/data'), { recursive: true })

      try {
        const sections: Array<{
          slug: string
          label: string
          order: number
          pages: Array<{ slug: string; title: string; description: string; order: number; path: string }>
        }> = []
        const docsContent: Record<string, string> = {}

        const sectionDirs = await fs.readdir(DOCS_CONTENT_DIR, { withFileTypes: true })
        for (const dir of sectionDirs) {
          if (!dir.isDirectory()) continue

          const sectionSlug = dir.name
          const sectionPath = path.join(DOCS_CONTENT_DIR, sectionSlug)

          // Read _meta.json for section metadata
          let meta: SectionMeta = { label: sectionSlug, order: 99 }
          try {
            const metaRaw = await fs.readFile(path.join(sectionPath, '_meta.json'), 'utf8')
            meta = JSON.parse(metaRaw) as SectionMeta
          } catch {
            // No _meta.json, use defaults
          }

          const pages: Array<{ slug: string; title: string; description: string; order: number; path: string }> = []
          const files = await fs.readdir(sectionPath)

          for (const file of files) {
            if (!file.endsWith('.md')) continue
            const filePath = path.join(sectionPath, file)
            const raw = await fs.readFile(filePath, 'utf8')
            const { data, content } = await parseFrontmatter(raw)
            const fm = data as DocFrontmatter
            const pageSlug = file.replace(/\.md$/, '')
            const docPath = `${sectionSlug}/${pageSlug}`

            pages.push({
              slug: pageSlug,
              title: (fm.title as string) ?? pageSlug,
              description: (fm.description as string) ?? '',
              order: (fm.order as number) ?? 99,
              path: docPath,
            })
            docsContent[docPath] = content
          }

          pages.sort((a, b) => a.order - b.order)

          sections.push({
            slug: sectionSlug,
            label: meta.label ?? sectionSlug,
            order: meta.order ?? 99,
            pages,
          })
        }

        sections.sort((a, b) => a.order - b.order)

        await fs.writeFile(DOCS_MANIFEST_OUTPUT, JSON.stringify(sections, null, 2))
        await fs.writeFile(DOCS_CONTENT_OUTPUT, JSON.stringify(docsContent, null, 2))
        console.log(`[docs] Built manifest with ${sections.length} sections, ${Object.keys(docsContent).length} pages`)
      } catch (err) {
        console.warn('[docs] Failed to build docs, build continues with cached data:', err)
      }
    },
  }
}

function agentsRegistryPlugin(): Plugin {
  return {
    name: 'load-agents-registry',
    async buildStart() {
      await fs.mkdir(path.resolve(__dirname, 'src/data'), { recursive: true })
      try {
        // Load index.json
        const indexRaw = await fs.readFile(path.join(AGENTS_REGISTRY_DIR, 'index.json'), 'utf8')
        const index = JSON.parse(indexRaw)

        // Load models.json
        const modelsRaw = await fs.readFile(path.join(AGENTS_REGISTRY_DIR, 'models/models.json'), 'utf8')
        const models = JSON.parse(modelsRaw)

        // Load MCP sources
        let mcpSources: Array<{ id: string; url: string; description: string }> = []
        try {
          const sourcesRaw = await fs.readFile(path.join(AGENTS_REGISTRY_DIR, 'mcps/sources.yaml'), 'utf8')
          // Simple YAML parse for registries
          const registries: Array<{ id: string; url: string; description: string }> = []
          let current: Record<string, string> = {}
          let inRegistries = false
          for (const line of sourcesRaw.split('\n')) {
            if (line.trim() === 'registries:') { inRegistries = true; continue }
            if (!inRegistries) continue
            const indentMatch = line.match(/^(\s+)- id:\s*(.+)/)
            if (indentMatch) {
              if (current.id) registries.push({ id: current.id, url: current.url || '', description: current.description || '' })
              current = { id: indentMatch[2].trim() }
              continue
            }
            const kvMatch = line.match(/^\s+(\w+):\s*(.+)/)
            if (kvMatch && current.id) {
              current[kvMatch[1].trim()] = kvMatch[2].trim().replace(/^["']|["']$/g, '')
            }
          }
          if (current.id) registries.push({ id: current.id, url: current.url || '', description: current.description || '' })
          mcpSources = registries
        } catch { /* no sources.yaml */ }

        // Load full agent YAML files
        const agents: Array<Record<string, unknown>> = []
        const agentsDir = path.join(AGENTS_REGISTRY_DIR, 'agents')
        try {
          const files = await fs.readdir(agentsDir)
          for (const file of files) {
            if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue
            const raw = await fs.readFile(path.join(agentsDir, file), 'utf8')
            // Simple YAML to extract key fields
            const agent: Record<string, unknown> = { file: file.replace(/\.ya?ml$/, '') }
            const lines = raw.split('\n')
            for (const line of lines) {
              const m = line.match(/^\s{2}(\w+):\s*(.+)/)
              if (m) {
                let val: unknown = m[2].trim().replace(/^["']|["']$/g, '')
                if (typeof val === 'string' && val.startsWith('[') && val.endsWith(']')) {
                  val = val.slice(1, -1).split(',').map((s: string) => s.trim())
                }
                agent[m[1]] = val
              }
            }
            agents.push(agent)
          }
        } catch { /* no agents dir */ }

        const result = {
          agents: index.agents ?? [],
          skills: index.skills ?? [],
          mcpSources,
          models: models.agents ?? {},
          agentDefinitions: agents,
        }

        await fs.writeFile(AGENTS_OUTPUT, JSON.stringify(result, null, 2))
        console.log(`[agents-registry] Loaded ${(index.agents ?? []).length} agents, ${Object.keys(models.agents ?? {}).length} agent model configs`)
      } catch (err) {
        console.warn('[agents-registry] Failed to load, build continues with cached data:', err)
      }
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    mcpRegistryPlugin(),
    skillsRegistryPlugin(),
    agentsRegistryPlugin(),
    articlesPlugin(),
    docsPlugin(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
