import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import mermaid from 'mermaid'

let counter = 0

interface MermaidDiagramProps {
  chart: string
}

const DARK_VARS = {
  primaryColor: '#1a1a1a',
  primaryTextColor: '#e0e0e0',
  primaryBorderColor: '#ff6b6b',
  lineColor: '#555',
  secondaryColor: '#111',
  tertiaryColor: '#0d0d0d',
  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
  fontSize: '14px',
  nodeBorder: '#ff6b6b',
  mainBkg: '#1a1a1a',
  clusterBkg: '#111',
  titleColor: '#ff6b6b',
  edgeLabelBackground: '#0a0a0a',
}

const LIGHT_VARS = {
  primaryColor: '#ffffff',
  primaryTextColor: '#1a1a1a',
  primaryBorderColor: '#ff6b6b',
  lineColor: '#ccc',
  secondaryColor: '#f5f5f5',
  tertiaryColor: '#eaeaea',
  fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
  fontSize: '14px',
  nodeBorder: '#ff6b6b',
  mainBkg: '#ffffff',
  clusterBkg: '#fafafa',
  titleColor: '#ff6b6b',
  edgeLabelBackground: '#f5f5f5',
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${++counter}`)

  useEffect(() => {
    const isDark = theme === 'dark'

    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'base',
      themeVariables: isDark ? DARK_VARS : LIGHT_VARS,
    })

    let cancelled = false

    async function render() {
      try {
        // Mermaid requires unique IDs per render
        idRef.current = `mermaid-${++counter}`
        const { svg: renderedSvg } = await mermaid.render(idRef.current, chart.trim())
        if (!cancelled) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [chart, theme])

  if (error) {
    return (
      <div className="my-4 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[var(--accent)] text-xs font-mono">mermaid error</span>
        </div>
        <pre className="text-[var(--text-tertiary)] text-xs font-mono overflow-x-auto">{chart}</pre>
      </div>
    )
  }

  return (
    <div className="my-4 border border-[var(--border-secondary)] bg-[var(--bg-secondary)] overflow-x-auto">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-red)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-yellow)]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-green)]" />
        <span className="ml-2 text-[var(--text-muted)] text-xs font-mono">diagram</span>
      </div>
      <div
        ref={containerRef}
        className="p-4 flex justify-center [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
