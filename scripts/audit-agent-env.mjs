#!/usr/bin/env node
// Exhaustive audit of the /agents sandbox.yml env resolution.
//
// For every (agent, model) in the product models.json it computes the web env
// via the shared resolver (src/app/lib/agent-env.mjs) and compares it against
// an independent Python reference (scripts/reference-agent-env.py, which uses
// the product providers.py `resolve` for prefixed models and a reviewed
// bare-model inference table). Prints per-agent totals and every mismatch.
//
// Usage: node scripts/audit-agent-env.mjs [path-to-nanosandbox-repo]

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { resolveSandboxEnv, gooseModelValue } from '../src/app/lib/agent-env.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO = process.argv[2] ?? resolve(__dirname, '../../nanosandbox')

const models = JSON.parse(
  readFileSync(resolve(REPO, 'registries/models/models.json'), 'utf8')
).agents
const catalog = JSON.parse(
  readFileSync(resolve(REPO, 'registries/models/provider-catalog.json'), 'utf8')
)

const reference = JSON.parse(
  execFileSync('python3', [resolve(__dirname, 'reference-agent-env.py'), REPO], {
    cwd: __dirname,
    encoding: 'utf8',
  })
)

function activeKeys(resolved) {
  const alt = resolved.alt ?? []
  return (resolved.keys ?? []).filter((k) => !alt.includes(k)).sort()
}

function gooseExtras(resolved) {
  if (!resolved) return {}
  return {
    gooseProvider: resolved.extras?.gooseProvider ?? null,
    gooseModel: resolved.extras?.gooseModel ?? null,
  }
}

let total = 0
let prefixed = 0
let bare = 0
let mismatches = 0
const residualBare = []
const perAgent = {}

for (const agent of Object.keys(models)) {
  const agentModels = models[agent].models
  const agentTotal = agentModels.length
  let agentPrefixed = 0
  let agentBare = 0
  let agentMismatch = 0
  const agentResidual = []

  for (const model of agentModels) {
    total++
    const isBare = !model.includes('/')
    if (isBare) {
      bare++
      agentBare++
    } else {
      prefixed++
      agentPrefixed++
    }

    const web = resolveSandboxEnv(catalog, agent, model)
    const ref = reference[agent][model]

    // Normalize reference to the same shape as the web resolver.
    const refActive = activeKeys({
      keys: ref?.keys ?? [],
      alt: ref?.alt ?? [],
    })
    const webActive = activeKeys(web ?? { keys: [], alt: [] })
    const refOauth = ref?.oauth ?? false
    const webOauth = web?.oauth ?? false
    const refProvider = ref?.provider ?? null
    const webProvider = web?.provider ?? null
    const refGoose = {
      gooseProvider: ref?.gooseProvider ?? null,
      gooseModel: ref?.gooseModel ?? null,
    }
    const webGoose = gooseExtras(web)

    const problems = []
    if (JSON.stringify(refActive) !== JSON.stringify(webActive)) {
      problems.push(`keys ref=${JSON.stringify(refActive)} web=${JSON.stringify(webActive)}`)
    }
    if (refOauth !== webOauth) {
      problems.push(`oauth ref=${refOauth} web=${webOauth}`)
    }
    if (refProvider !== webProvider) {
      problems.push(`provider ref=${refProvider} web=${webProvider}`)
    }
    if (JSON.stringify(refGoose) !== JSON.stringify(webGoose)) {
      problems.push(`goose ref=${JSON.stringify(refGoose)} web=${JSON.stringify(webGoose)}`)
    }

    if (problems.length > 0) {
      mismatches++
      agentMismatch++
      console.log(`MISMATCH ${agent} ${model}: ${problems.join('; ')}`)
    }

    // Track bare models that fall back to AGENT_META (provider null).
    if (isBare && webProvider === null) {
      agentResidual.push(model)
      residualBare.push(`${agent}:${model}`)
    }
  }

  perAgent[agent] = {
    total: agentTotal,
    prefixed: agentPrefixed,
    bare: agentBare,
    mismatches: agentMismatch,
    residualBare: agentResidual,
  }
}

console.log('\n=== PER-AGENT TOTALS ===')
for (const [agent, info] of Object.entries(perAgent)) {
  console.log(
    `${agent}: total=${info.total} prefixed=${info.prefixed} bare=${info.bare} mismatches=${info.mismatches}` +
      (info.residualBare.length ? ` residualBare=${info.residualBare.join(',')}` : '')
  )
}

console.log('\n=== SUMMARY ===')
console.log(`total combos: ${total}`)
console.log(`prefixed: ${prefixed}`)
console.log(`bare: ${bare}`)
console.log(`mismatches: ${mismatches}`)
console.log(`residual bare (AGENT_META fallback): ${residualBare.length}`)
if (residualBare.length) console.log(`  ${residualBare.join('\n  ')}`)

process.exit(mismatches > 0 ? 1 : 0)