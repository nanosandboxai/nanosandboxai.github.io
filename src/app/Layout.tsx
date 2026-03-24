import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import { ThemeToggle } from './components/theme-toggle'

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
      <span className="text-[var(--text-tertiary)]">cpu {cpu.toFixed(0)}%</span>
      <span className="text-[var(--text-tertiary)]">mem {mem.toFixed(0)}%</span>
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
            className={`px-3 py-2 border-r border-[var(--border-secondary)] transition-colors whitespace-nowrap ${
              isActive(item.path)
                ? 'text-[var(--accent)] bg-[var(--bg-elevated)] border-b-2 border-b-[var(--accent)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            {displayLabel}
            {isCurrent && (
              <span className="inline-block w-1.5 h-3.5 bg-[var(--accent)] ml-0.5 align-middle animate-pulse" />
            )}
          </Link>
        )
      })}
    </>
  )
}

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-heading)]">
      {/* Single-line header: prompt + nav tabs + stats */}
      <header className="border-b border-[var(--border-primary)] bg-[var(--bg-inverse)]">
        <div className="container mx-auto px-4 max-w-7xl flex items-center font-mono text-sm">
          {/* Terminal prompt */}
          <div className="flex items-center gap-1.5 pr-3 py-2 border-r border-[var(--border-secondary)] flex-shrink-0">
            <span className="text-[var(--accent)]">nanosandbox</span>
            <span className="text-[var(--text-tertiary)] hidden sm:inline">@terminal</span>
            <span className="text-[var(--text-heading)]">:~</span>
            <span className="text-[var(--text-tertiary)] animate-pulse">_</span>
          </div>

          {/* Nav items — hidden on mobile */}
          <div className="hidden md:contents">
            <TypewriterNav />
          </div>

          {/* Push stats to the right */}
          <div className="flex-1" />
          <div className="py-2 pl-3 flex-shrink-0 flex items-center gap-3">
            <div className="hidden sm:block">
              <SystemStats />
            </div>
            <div className="hidden sm:block h-4 w-px bg-[var(--border-secondary)]" />
            <ThemeToggle />
            {/* Hamburger button — mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1 px-1 py-1"
              aria-label="Toggle menu"
            >
              <span className={`w-4 h-0.5 bg-[var(--text-tertiary)] transition-transform ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`w-4 h-0.5 bg-[var(--text-tertiary)] transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`w-4 h-0.5 bg-[var(--text-tertiary)] transition-transform ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-secondary)] bg-[var(--bg-inverse)]">
            <nav className="container mx-auto px-4 py-2 font-mono text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`block px-3 py-2 transition-colors ${
                    isActive(item.path)
                      ? 'text-[var(--accent)] bg-[var(--bg-elevated)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-4 md:py-6 max-w-7xl pb-16">
        <Outlet />
      </main>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[var(--border-primary)] bg-[var(--bg-inverse)]">
        <div className="px-4 py-1 flex items-center gap-4 font-mono text-xs">
          <span className="text-[var(--accent)]">$</span>
          <span className="text-[var(--text-tertiary)]">nanosb --help</span>
          <div className="flex-1" />
          <span className="text-[var(--text-tertiary)] hidden md:inline">[Ctrl+C] Exit</span>
          <span className="text-[var(--text-tertiary)] hidden md:inline">[^] Navigate</span>
          <span className="text-[var(--text-heading)] hidden md:inline">[Enter] Select</span>
        </div>
      </div>
    </div>
  )
}
