import { Children, isValidElement, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'
import { MermaidDiagram } from './mermaid-diagram'
import TerminalDemo, { parseTerminalScript } from './terminal-demo'

function extractLanguageFromPre(
  children: React.ReactNode,
  language: string,
): string | null {
  const childArray = Children.toArray(children)
  if (childArray.length !== 1) return null
  const child = childArray[0]
  if (!isValidElement(child)) return null
  const props = child.props as { className?: string; children?: React.ReactNode }
  const className = props.className ?? ''
  if (!className.includes(`language-${language}`)) return null
  const text = typeof props.children === 'string' ? props.children : null
  return text
}

/** @deprecated Use extractLanguageFromPre(children, 'mermaid') instead */
function extractMermaidFromPre(children: React.ReactNode): string | null {
  return extractLanguageFromPre(children, 'mermaid')
}

function extractTextFromChildren(children: React.ReactNode): string {
  const parts: string[] = []
  Children.forEach(children, (child) => {
    if (typeof child === 'string') {
      parts.push(child)
    } else if (isValidElement(child)) {
      const props = child.props as { children?: React.ReactNode }
      if (props.children) {
        parts.push(extractTextFromChildren(props.children))
      }
    }
  })
  return parts.join('')
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--text-muted)] hover:text-[var(--text-heading)] text-xs font-mono transition-colors"
    >
      {copied ? 'copied!' : '[copy]'}
    </button>
  )
}

interface MarkdownRendererProps {
  content: string
  basePath?: string
}

function createComponents(basePath?: string): Components {
  return {
    h1: ({ children }) => (
      <h1 className="text-xl md:text-2xl font-bold text-[var(--accent)] mb-4 font-mono">{children}</h1>
    ),
    h2: ({ children }) => {
      const id =
        typeof children === 'string'
          ? children.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
          : undefined
      return (
        <h2 id={id} className="text-lg md:text-xl font-bold text-[var(--text-heading)] mt-8 mb-3 font-mono border-b border-[var(--border-secondary)] pb-2">
          <a href={`#${id}`} className="hover:text-[var(--accent)] transition-colors">
            {children}
          </a>
        </h2>
      )
    },
    h3: ({ children }) => (
      <h3 className="text-lg font-bold text-[var(--text-heading)] mt-6 mb-2 font-mono">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-base font-bold text-[var(--text-secondary)] mt-4 mb-2 font-mono">{children}</h4>
    ),
    p: ({ children }) => <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">{children}</p>,
    a: ({ href, children }) => {
      let resolvedHref = href ?? ''

      // Fix relative .md links in docs: ./foo.md -> /docs/section/foo
      if (resolvedHref.startsWith('./') && resolvedHref.endsWith('.md') && basePath) {
        const section = basePath.split('/')[0]
        const target = resolvedHref.slice(2, -3) // strip ./ and .md
        resolvedHref = `/docs/${section}/${target}`
      }

      const isExternal = resolvedHref.startsWith('http')
      return (
        <a
          href={resolvedHref}
          className="text-[var(--accent)] hover:text-[var(--accent-hover)] underline transition-colors"
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    },
    ul: ({ children }) => <ul className="list-disc list-inside text-[var(--text-secondary)] text-sm space-y-1 mb-4 ml-2">{children}</ul>,
    ol: ({ children }) => <ol className="list-decimal list-inside text-[var(--text-secondary)] text-sm space-y-1 mb-4 ml-2">{children}</ol>,
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[var(--accent)] pl-4 my-4 text-[var(--text-tertiary)] italic">{children}</blockquote>
    ),
    hr: () => <hr className="border-[var(--border-secondary)] my-6" />,
    strong: ({ children }) => <strong className="text-[var(--text-heading)] font-bold">{children}</strong>,
    em: ({ children }) => <em className="text-[var(--text-secondary)]">{children}</em>,
    code: ({ className, children }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code className="bg-[var(--bg-elevated)] text-[var(--accent)] px-1.5 py-0.5 text-xs font-mono border border-[var(--border-secondary)]">
            {children}
          </code>
        )
      }
      return (
        <code className={`${className ?? ''} text-sm`}>{children}</code>
      )
    },
    pre: ({ children }) => {
      const mermaidCode = extractMermaidFromPre(children)
      if (mermaidCode) {
        return <MermaidDiagram chart={mermaidCode} />
      }

      const terminalCode = extractLanguageFromPre(children, 'terminal')
      if (terminalCode) {
        const lines = parseTerminalScript(terminalCode)
        return <TerminalDemo demos={[{ title: 'Demo', lines }]} />
      }

      const codeText = extractTextFromChildren(children)

      return (
        <div className="my-4 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] overflow-x-auto">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-red)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-yellow)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-green)]" />
            </div>
            <CopyButton text={codeText} />
          </div>
          <pre className="p-2 md:p-4 font-mono text-xs md:text-sm text-[var(--text-primary)] overflow-x-auto">{children}</pre>
        </div>
      )
    },
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto border border-[var(--border-secondary)]">
        <table className="w-full text-sm font-mono">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-secondary)]">{children}</thead>,
    th: ({ children }) => <th className="px-2 md:px-3 py-2 text-left text-[var(--accent)] font-bold text-xs">{children}</th>,
    td: ({ children }) => <td className="px-2 md:px-3 py-2 text-[var(--text-secondary)] text-xs border-t border-[var(--border-tertiary)]">{children}</td>,
  }
}

export function MarkdownRenderer({ content, basePath }: MarkdownRendererProps) {
  const components = createComponents(basePath)

  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
