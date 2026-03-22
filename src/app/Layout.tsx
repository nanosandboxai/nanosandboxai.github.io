import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router'

const navItems = [
  { path: '/', label: 'home' },
  { path: '/mcp', label: 'mcp' },
  { path: '/skill', label: 'skill' },
  { path: '/agents', label: 'agents' },
  { path: '/docs', label: 'docs' },
  { path: '/articles', label: 'articles' },
  { path: '/coming-soon', label: 'coming soon...' },
]

function SystemStats() {
  const [cpu, setCpu] = useState(12)
  const [mem, setMem] = useState(34)

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu((prev) => {
        const delta = (Math.random() - 0.45) * 8
        return Math.max(3, Math.min(45, prev + delta))
      })
      setMem((prev) => {
        const delta = (Math.random() - 0.5) * 4
        return Math.max(20, Math.min(68, prev + delta))
      })
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-3 font-mono text-xs flex-shrink-0">
      <span className="text-[#888]">cpu {cpu.toFixed(0)}%</span>
      <span className="text-[#888]">mem {mem.toFixed(0)}%</span>
    </div>
  )
}

function TypewriterNav() {
  const location = useLocation()
  const [visibleCount, setVisibleCount] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const hasAnimated = useRef(false)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  useEffect(() => {
    if (hasAnimated.current) {
      setVisibleCount(navItems.length)
      return
    }

    if (visibleCount >= navItems.length) {
      hasAnimated.current = true
      return
    }

    const currentLabel = navItems[visibleCount].label

    if (charIndex < currentLabel.length) {
      const timeout = setTimeout(() => {
        setCharIndex((c) => c + 1)
      }, 30 + Math.random() * 25)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => {
      setVisibleCount((v) => v + 1)
      setCharIndex(0)
    }, 80)
    return () => clearTimeout(timeout)
  }, [visibleCount, charIndex])

  return (
    <>
      {navItems.map((item, i) => {
        if (i > visibleCount) return null

        const isCurrent = i === visibleCount && visibleCount < navItems.length
        const displayLabel = isCurrent
          ? item.label.slice(0, charIndex)
          : item.label

        return (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-2 border-r border-[#333] transition-colors whitespace-nowrap ${
              isActive(item.path)
                ? 'text-[#ff6b6b] bg-[#1a1a1a] border-b-2 border-b-[#ff6b6b]'
                : 'text-[#888] hover:text-white hover:bg-[#111]'
            }`}
          >
            {displayLabel}
            {isCurrent && (
              <span className="inline-block w-1.5 h-3.5 bg-[#ff6b6b] ml-0.5 align-middle animate-pulse" />
            )}
          </Link>
        )
      })}
    </>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Single-line header: prompt + nav tabs + stats */}
      <header className="border-b border-[#444] bg-black">
        <div className="container mx-auto px-4 max-w-7xl flex items-center font-mono text-sm overflow-x-auto">
          {/* Terminal prompt */}
          <div className="flex items-center gap-1.5 pr-3 py-2 border-r border-[#333] flex-shrink-0">
            <span className="text-[#ff6b6b]">nanosandbox</span>
            <span className="text-[#888]">@terminal</span>
            <span className="text-white">:~</span>
            <span className="text-[#888] animate-pulse">_</span>
          </div>

          {/* Nav items typed in on the same line */}
          <TypewriterNav />

          {/* Push stats to the right */}
          <div className="flex-1" />
          <div className="py-2 pl-3 flex-shrink-0">
            <SystemStats />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl pb-16">
        <Outlet />
      </main>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#444] bg-black">
        <div className="px-4 py-1 flex items-center gap-4 font-mono text-xs">
          <span className="text-[#ff6b6b]">$</span>
          <span className="text-[#888]">nanosb --help</span>
          <div className="flex-1" />
          <span className="text-[#888]">[Ctrl+C] Exit</span>
          <span className="text-[#888]">[^] Navigate</span>
          <span className="text-[#888]">[Enter] Select</span>
        </div>
      </div>
    </div>
  )
}
