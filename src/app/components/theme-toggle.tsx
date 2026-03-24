import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-14 h-5" />
  }

  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex items-center gap-1 px-2 py-1 md:px-1.5 md:py-0.5 border border-[var(--border-secondary)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors rounded-sm font-mono text-xs cursor-pointer"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="text-[var(--text-tertiary)]">{isDark ? '\u2600' : '\u263E'}</span>
      <span className="text-[var(--text-tertiary)]">{isDark ? 'light' : 'dark'}</span>
    </button>
  )
}
