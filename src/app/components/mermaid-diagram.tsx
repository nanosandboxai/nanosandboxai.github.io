import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
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
  },
})

let counter = 0

interface MermaidDiagramProps {
  chart: string
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${++counter}`)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
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
  }, [chart])

  if (error) {
    return (
      <div className="my-4 border border-[#333] bg-[#0d0d0d] p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#ff6b6b] text-xs font-mono">mermaid error</span>
        </div>
        <pre className="text-[#888] text-xs font-mono overflow-x-auto">{chart}</pre>
      </div>
    )
  }

  return (
    <div className="my-4 border border-[#333] bg-[#0d0d0d] overflow-x-auto">
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#333] bg-[#111]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
        <span className="ml-2 text-[#666] text-xs font-mono">diagram</span>
      </div>
      <div
        ref={containerRef}
        className="p-4 flex justify-center [&_svg]:max-w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
