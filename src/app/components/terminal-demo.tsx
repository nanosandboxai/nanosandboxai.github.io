import { useState, useEffect, useRef, useCallback } from 'react'

export interface TerminalLine {
  type: 'command' | 'output' | 'comment' | 'blank'
  text: string
  delay?: number
}

export interface TerminalDemoData {
  title: string
  lines: TerminalLine[]
}

/**
 * Parse a plain-text terminal script into TerminalLine[].
 *
 * Format:
 *   # comment line
 *   $ command to type
 *   (empty line)        → blank
 *   anything else       → output
 */
export function parseTerminalScript(text: string): TerminalLine[] {
  return text
    .replace(/^\n+|\n+$/g, '')
    .split('\n')
    .map((raw): TerminalLine => {
      if (raw.trim() === '') return { type: 'blank', text: '' }
      if (raw.startsWith('# ')) return { type: 'comment', text: raw }
      if (raw.startsWith('$ ')) return { type: 'command', text: raw.slice(2), delay: 40 }
      return { type: 'output', text: raw }
    })
}

const REPLAY_DELAY_MS = 3000

const DEFAULT_DEMOS: TerminalDemoData[] = [
  {
    title: 'TUI Mode',
    lines: [
      { type: 'comment', text: '# Launch the interactive TUI' },
      { type: 'command', text: 'nanosb', delay: 60 },
      { type: 'blank', text: '' },
      { type: 'output', text: '  \u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557' },
      { type: 'output', text: '  \u2551  NANOSANDBOX TUI v0.1.0                     \u2551' },
      { type: 'output', text: '  \u2551  3 agents running \u00b7 2 sandboxes active       \u2551' },
      { type: 'output', text: '  \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563' },
      { type: 'output', text: '  \u2551  [0] claude  \u25cf running  python:3.12-slim    \u2551' },
      { type: 'output', text: '  \u2551  [1] goose   \u25cf running  node:22-slim        \u2551' },
      { type: 'output', text: '  \u2551  [2] codex   \u25cb idle                          \u2551' },
      { type: 'output', text: '  \u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563' },
      { type: 'output', text: '  \u2551  /add <agent>  /focus <n>  /kill  /quit     \u2551' },
      { type: 'output', text: '  \u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d' },
      { type: 'blank', text: '' },
      { type: 'comment', text: '# Add a new agent with project mounting' },
      { type: 'command', text: '/add claude --project ~/myapp', delay: 50 },
      { type: 'output', text: '  \u2713 Pulling python:3.12-slim...' },
      { type: 'output', text: '  \u2713 Sandbox created (boot: 180ms)' },
      { type: 'output', text: '  \u2713 Agent claude attached to panel [3]' },
    ],
  },
  {
    title: 'CLI Usage',
    lines: [
      { type: 'comment', text: '# Pull an OCI image' },
      { type: 'command', text: 'nanosb pull python:3.12-slim', delay: 40 },
      { type: 'output', text: '  Pulling python:3.12-slim from docker.io...' },
      { type: 'output', text: '  \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 100% (45.2 MB)' },
      { type: 'output', text: '  \u2713 Image cached locally' },
      { type: 'blank', text: '' },
      { type: 'comment', text: '# Run a command in a new sandbox' },
      { type: 'command', text: "nanosb run python:3.12-slim python -c \"print('Hello from microVM')\"", delay: 35 },
      { type: 'output', text: '  \u2713 Sandbox sb-a1b2c3 created (boot: 142ms)' },
      { type: 'output', text: '  Hello from microVM' },
      { type: 'output', text: '  \u2713 Sandbox stopped and removed' },
      { type: 'blank', text: '' },
      { type: 'comment', text: '# Check running sandboxes' },
      { type: 'command', text: 'nanosb ps', delay: 60 },
      { type: 'output', text: '  ID          IMAGE                STATUS    UPTIME' },
      { type: 'output', text: '  sb-d4e5f6   python:3.12-slim     running   4m 12s' },
      { type: 'output', text: '  sb-g7h8i9   node:22-slim         running   1m 38s' },
    ],
  },
]

interface TerminalDemoProps {
  demos?: TerminalDemoData[]
}

export default function TerminalDemo({ demos }: TerminalDemoProps = {}) {
  const allDemos = demos ?? DEFAULT_DEMOS
  const [activeDemo, setActiveDemo] = useState(0)
  const [visibleLines, setVisibleLines] = useState(0)
  const [typedChars, setTypedChars] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const demo = allDemos[activeDemo]
  const currentLine = demo.lines[visibleLines]

  // Reset animation when user switches tabs
  const handleTabClick = useCallback((index: number) => {
    setActiveDemo(index)
    setVisibleLines(0)
    setTypedChars(0)
    setIsTyping(false)
  }, [])

  useEffect(() => {
    if (visibleLines >= demo.lines.length) {
      // All lines shown — replay same demo after pause
      const timeout = setTimeout(() => {
        setVisibleLines(0)
        setTypedChars(0)
        setIsTyping(false)
      }, REPLAY_DELAY_MS)
      return () => clearTimeout(timeout)
    }

    const line = demo.lines[visibleLines]

    if (line.type === 'command' && typedChars < line.text.length) {
      setIsTyping(true)
      const delay = line.delay || 50
      const jitter = delay + (Math.random() - 0.5) * 30
      const timeout = setTimeout(() => {
        setTypedChars((c) => c + 1)
      }, jitter)
      return () => clearTimeout(timeout)
    }

    // Line fully typed or non-command — advance
    setIsTyping(false)
    const advanceDelay = line.type === 'command' ? 400 : line.type === 'blank' ? 200 : 80
    const timeout = setTimeout(() => {
      setVisibleLines((v) => v + 1)
      setTypedChars(0)
    }, advanceDelay)
    return () => clearTimeout(timeout)
  }, [visibleLines, typedChars, demo])

  return (
    <div className="border border-[var(--border-primary)] bg-[var(--bg-inverse)] font-mono text-sm">
      {/* Title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-red)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-yellow)]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--terminal-green)]" />
        </div>
        <div className="flex gap-1">
          {allDemos.map((d, i) => (
            <button
              key={d.title}
              onClick={() => handleTabClick(i)}
              className={`px-2 py-0.5 text-xs border transition-colors ${
                activeDemo === i
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black'
                  : 'bg-[var(--bg-elevated)] border-[var(--border-secondary)] text-[var(--text-tertiary)] hover:border-[var(--text-muted)] hover:text-[var(--text-heading)]'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
        <span className="text-[var(--text-muted)] text-xs">nanosb</span>
      </div>

      {/* Terminal body — fixed height */}
      <div className="p-4 h-[420px] overflow-hidden">
        {demo.lines.slice(0, visibleLines + 1).map((line, i) => {
          const isCurrentLine = i === visibleLines
          const isCommandTyping = isCurrentLine && line.type === 'command' && typedChars < line.text.length

          if (line.type === 'blank') return <div key={i} className="h-4" />

          if (line.type === 'comment') {
            return (
              <div key={i} className="text-[var(--text-muted)] text-xs">
                {i <= visibleLines ? line.text : ''}
              </div>
            )
          }

          if (line.type === 'command') {
            const displayed = isCommandTyping ? line.text.slice(0, typedChars) : line.text
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[var(--accent)]">$</span>
                <span className="text-[var(--text-heading)]">
                  {displayed}
                  {isCommandTyping && (
                    <span className="inline-block w-2 h-4 bg-[var(--accent)] ml-0.5 align-middle animate-pulse" />
                  )}
                </span>
              </div>
            )
          }

          // output
          return (
            <div key={i} className="text-[var(--text-secondary)] text-xs leading-relaxed">
              {line.text}
            </div>
          )
        })}

        {/* Idle cursor after all lines */}
        {visibleLines >= demo.lines.length && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[var(--accent)]">$</span>
            <span className="inline-block w-2 h-4 bg-[var(--accent)] animate-pulse" />
          </div>
        )}
      </div>
    </div>
  )
}
