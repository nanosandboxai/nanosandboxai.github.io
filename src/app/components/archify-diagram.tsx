import { useEffect, useMemo, useRef, useState } from 'react'

export interface ArchifySpec {
  src: string
  title?: string
  height?: number
  caption?: string
}

// Parse the body of an ```archify fenced block:
//   src: /diagrams/architecture-overview.html
//   title: How a sandbox boots        (used as the accessible label)
//   height: 560                       (fallback height until the diagram reports its size)
export function parseArchifySpec(text: string): ArchifySpec | null {
  const spec: Record<string, string> = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([a-z]+)\s*:\s*(.+?)\s*$/i)
    if (m) spec[m[1].toLowerCase()] = m[2]
  }
  if (!spec.src) return null
  const h = Number(spec.height)
  return { src: spec.src, title: spec.title, caption: spec.caption, height: Number.isFinite(h) && h > 200 ? h : undefined }
}

// Only self-hosted diagrams generated with Archify are allowed: they live in public/diagrams/.
const isAllowedSrc = (src: string) => /^\/diagrams\/[a-z0-9][a-z0-9-]*\.html(#[\w=&%-]*)?$/i.test(src)

const useSiteTheme = () => {
  const read = () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(read)
  useEffect(() => {
    const mo = new MutationObserver(() => setTheme(read()))
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return theme
}

/**
 * Injected before the Archify viewer's own scripts. The frame has an opaque origin, so real
 * storage is unavailable: an in-memory store stands in, pre-seeded so the viewer starts in Live
 * motion and in the site's theme. It then reports the diagram's size so the frame can match it.
 */
const bootScript = (theme: string, token: string) => `<script>(function(){
  var seed={"archify-motion":"live","theme":${JSON.stringify(theme)}};
  function mem(init){var d=Object.assign({},init);return{getItem:function(k){return Object.prototype.hasOwnProperty.call(d,k)?d[k]:null},setItem:function(k,v){d[k]=String(v)},removeItem:function(k){delete d[k]},clear:function(){d={}},key:function(i){return Object.keys(d)[i]||null},get length(){return Object.keys(d).length}}}
  ["localStorage","sessionStorage"].forEach(function(n){var s=n==="localStorage"?seed:{};try{Object.defineProperty(window,n,{value:mem(s),configurable:true})}catch(e){}});
  function report(){var svg=document.querySelector(".diagram-container > svg");if(!svg)return;var vb=(svg.getAttribute("viewBox")||"").split(/\\s+/).map(Number);if(vb.length===4&&vb[2]>0&&vb[3]>0)parent.postMessage({archifySize:${JSON.stringify(token)},w:vb[2],h:vb[3]},"*")}
  addEventListener("load",function(){report();setTimeout(report,400)});
})();</script>`

// Show only the drawing: hide the toolbar, title, panels, navigation, rail, feedback and toasts.
const EMBED_CSS = `<style>
  html,body{margin:0!important;padding:0!important;height:100%!important;overflow:hidden!important;background:transparent!important}
  .toolbar,.header,.page-feedback,.archify-toast,.reader-rail,.cards,.parent-back-bar{display:none!important}
  .container{margin:0!important;padding:0!important;max-width:none!important;width:100%!important;height:100%!important;display:block!important}
  .diagram-container{margin:0!important;padding:0!important;border:0!important;border-radius:0!important;box-shadow:none!important;height:100%!important;width:100%!important;overflow:hidden!important}
  .diagram-container > :not(svg){display:none!important}
  .diagram-container > svg{display:block!important;width:100%!important;height:100%!important;max-width:none!important}
</style>`

/**
 * Embeds an Archify diagram (a self-contained HTML file) in docs and articles as a pure,
 * moving illustration: no viewer controls, legend, title bar or caption.
 * The HTML is fetched when the diagram nears the viewport and shown in a sandboxed iframe
 * (scripts only, opaque origin), so it cannot touch the site's cookies, storage or DOM.
 */
export function ArchifyDiagram({ src, title, height = 480 }: ArchifySpec) {
  const boxRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [raw, setRaw] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [ratio, setRatio] = useState<number | null>(null)
  const theme = useSiteTheme()
  const allowed = isAllowedSrc(src)
  const token = useMemo(() => Math.random().toString(36).slice(2), [])

  useEffect(() => {
    if (!allowed || !boxRef.current) return
    let cancelled = false
    const load = () =>
      fetch(src.split('#')[0])
        .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
        .then((t) => !cancelled && setRaw(t))
        .catch(() => !cancelled && setError(true))
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          io.disconnect()
          load()
        }
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(boxRef.current)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [src, allowed])

  // Size the frame to the diagram's own proportions once it reports them.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow || e.data?.archifySize !== token) return
      const { w, h } = e.data as { w: number; h: number }
      if (w > 0 && h > 0) setRatio(w / h)
    }
    addEventListener('message', onMsg)
    return () => removeEventListener('message', onMsg)
  }, [token])

  // Rebuild the document when the site theme changes, so the diagram follows it.
  const srcDoc = useMemo(() => {
    if (!raw) return null
    const inject = bootScript(theme, token) + EMBED_CSS
    return /<head[^>]*>/i.test(raw) ? raw.replace(/<head([^>]*)>/i, (m) => m + inject) : inject + raw
  }, [raw, theme, token])

  if (!allowed) {
    return (
      <div className="my-4 border border-[var(--terminal-red)] bg-[var(--bg-secondary)] p-4 font-mono text-xs text-[var(--terminal-red)]">
        archify: "{src}" is not allowed. Diagrams must be local files under /diagrams/*.html.
      </div>
    )
  }

  return (
    <figure className="my-6 overflow-hidden border border-[var(--border-secondary)] bg-[var(--bg-secondary)]">
      <div
        ref={boxRef}
        className="relative w-full"
        style={ratio ? { aspectRatio: String(ratio) } : { height }}
        role="img"
        aria-label={title ?? 'Animated diagram'}
      >
        {srcDoc === null && (
          <div className="absolute inset-0 grid place-items-center font-mono text-xs text-[var(--text-muted)]">
            {error ? 'diagram could not be loaded' : 'loading diagram…'}
          </div>
        )}
        {srcDoc !== null && (
          <iframe
            ref={frameRef}
            key={theme}
            srcDoc={srcDoc}
            title={title ?? 'Animated diagram'}
            tabIndex={-1}
            aria-hidden="true"
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full border-0"
          />
        )}
      </div>
    </figure>
  )
}
