import docsManifest from '@data/docs-manifest.json'
import docsContent from '@data/docs-content.json'

export interface DocPage {
  slug: string
  title: string
  description: string
  order: number
  path: string
}

export interface DocSection {
  slug: string
  label: string
  order: number
  pages: DocPage[]
}

export const manifest = docsManifest as DocSection[]
export const content = docsContent as Record<string, string>

/** Every page in reading order, with its section. */
export const flatPages = manifest.flatMap((section) => section.pages.map((page) => ({ section, page })))

export { slugify } from './slug'
import { slugify } from './slug'

/** Drop a leading `# Title` line: the page header already shows the title. */
export function stripLeadingH1(markdown: string): string {
  return markdown.replace(/^\s*#\s+[^\n]+\n/, '')
}

export interface Heading {
  id: string
  text: string
  level: 2 | 3
}

/** ## and ### headings outside fenced code blocks, for the page outline. */
export function extractHeadings(markdown: string): Heading[] {
  const out: Heading[] = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/)
    if (m) {
      const text = m[2].replace(/`/g, '').replace(/\*\*/g, '')
      out.push({ id: slugify(text), text, level: m[1].length as 2 | 3 })
    }
  }
  return out
}

/** Reading time from prose words (code blocks count at a third). */
export function readingMinutes(markdown: string): number {
  const code = (markdown.match(/```[\s\S]*?```/g) ?? []).join(' ')
  const prose = markdown.replace(/```[\s\S]*?```/g, ' ')
  const words = prose.split(/\s+/).filter(Boolean).length + code.split(/\s+/).filter(Boolean).length / 3
  return Math.max(1, Math.round(words / 220))
}

const READ_KEY = 'docs-read'

export function getReadPages(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? '[]') as string[])
  } catch {
    return new Set()
  }
}

export function markRead(path: string): Set<string> {
  const read = getReadPages()
  read.add(path)
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...read]))
  } catch {
    // Storage may be blocked; progress is a convenience only.
  }
  return read
}

export function editUrl(path: string): string {
  return `https://github.com/nanosandboxai/nanosandboxai.github.io/edit/main/content/docs/${path}.md`
}
