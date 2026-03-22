import { useState, useCallback } from 'react'
import TerminalDemo from '@/app/components/terminal-demo'

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [text])

  return (
    <button
      onClick={handleCopy}
      className={`text-[#888] text-xs hover:text-white transition-colors ${className}`}
    >
      {copied ? '[copied!]' : '[copy]'}
    </button>
  )
}

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <div className="mb-6 border border-[#444] bg-black p-6 font-mono">
        <div className="flex items-center gap-5 mb-4">
          <img src="/logo.svg" alt="Nanosandbox" className="w-18 h-18 flex-shrink-0" />
          <div>
            <h1 className="text-3xl font-bold text-[#ff6b6b] mb-1">NANOSANDBOX</h1>
            <p className="text-white text-lg">VM-Isolated Sandboxes for AI Code Agents</p>
          </div>
        </div>
        <p className="text-[#888] text-sm leading-relaxed">
          Deploy AI agents in hardware-isolated microVMs with sub-second boot times.
          <br />
          OCI image support, cross-platform (macOS, Linux, Windows), and built-in
          <br />
          multi-agent TUI for concurrent development workflows.
        </p>
      </div>

      {/* Getting Started */}
      <div className="mb-6 border border-[#333] bg-[#0d0d0d] p-4 font-mono">
        <h2 className="text-lg font-bold text-[#ff6b6b] mb-3">$ Getting Started</h2>
        <div className="text-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#888] text-xs"># Install nanosb</p>
            <CopyButton text="curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash" />
          </div>
          <div className="bg-[#111] border border-[#333] p-3">
            <code className="text-[#e0e0e0]">
              curl -fsSL https://github.com/nanosandboxai/cli/releases/latest/download/install.sh | bash
            </code>
          </div>
        </div>
      </div>

      {/* Terminal Demo */}
      <div className="mb-6">
        <TerminalDemo />
      </div>

      {/* Features */}
      <div className="mb-6 border border-[#333] bg-[#0d0d0d] p-4 font-mono">
        <h2 className="text-lg font-bold text-[#ff6b6b] mb-3">$ Features</h2>
        <div className="space-y-2 text-sm">
          {[
            { name: 'VM-Level Isolation', desc: 'Each sandbox runs in its own microVM via libkrun with an independent kernel' },
            { name: 'Sub-Second Boot Times', desc: 'Optimized libkrun startup for near-instant sandbox creation' },
            { name: 'OCI Image Support', desc: 'Pull from Docker Hub, GHCR, or any private registry' },
            { name: 'Multi-Agent TUI', desc: 'Run multiple AI agents concurrently in panel-based terminal UI' },
            { name: 'Project Mounting', desc: 'VirtioFS mounts with automatic git integration and branch tracking' },
            { name: 'MCP Server Support', desc: 'Model Context Protocol integration for agent tooling' },
            { name: 'Cross-Platform', desc: 'macOS Apple Silicon (HVF), Linux (KVM), Windows (HCS)' },
            { name: 'Streaming I/O', desc: 'Real-time output streaming with backpressure handling' },
          ].map((f) => (
            <div key={f.name} className="flex items-start gap-2">
              <span className="text-[#ff6b6b]">&#10003;</span>
              <div>
                <span className="text-white">{f.name}</span>
                <p className="text-[#888] text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Commands */}
      <div className="mb-6 border border-[#333] bg-[#0d0d0d] p-4 font-mono">
        <h2 className="text-lg font-bold text-[#ff6b6b] mb-3">$ Common Commands</h2>
        <div className="space-y-1.5 text-xs">
          {[
            { cmd: 'nanosb pull <IMAGE>', desc: 'Pull an OCI image from a registry' },
            { cmd: 'nanosb run <IMAGE> [CMD]', desc: 'Run a command in a new sandbox' },
            { cmd: 'nanosb exec <ID> <CMD>', desc: 'Execute command in running sandbox' },
            { cmd: 'nanosb ps', desc: 'List running sandboxes' },
            { cmd: 'nanosb stop <SANDBOX>', desc: 'Stop a running sandbox' },
            { cmd: 'nanosb rm <SANDBOX>', desc: 'Remove a sandbox' },
            { cmd: 'nanosb images', desc: 'List cached images' },
            { cmd: 'nanosb doctor', desc: 'Check runtime prerequisites' },
            { cmd: 'nanosb cleanup', desc: 'Clean up stale project clones' },
          ].map((c) => (
            <div key={c.cmd} className="flex items-center gap-2 group">
              <span className="text-white w-48 flex-shrink-0">{c.cmd}</span>
              <span className="text-[#888] flex-1">{c.desc}</span>
              <CopyButton text={c.cmd} className="opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border border-[#444] bg-black p-4 font-mono text-center">
        <div className="flex items-center justify-center gap-8 text-xs text-[#888] mb-2">
          <a href="/docs" className="hover:text-[#ff6b6b] transition-colors">Documentation</a>
          <a href="https://github.com/nanosandboxai" className="hover:text-[#ff6b6b] transition-colors" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="/agents" className="hover:text-[#ff6b6b] transition-colors">Agents</a>
          <a href="/mcp" className="hover:text-[#ff6b6b] transition-colors">MCP</a>
        </div>
        <p className="text-[#666] text-xs">NanoSandbox &copy; 2026 | Open Source Project</p>
      </div>
    </>
  )
}
