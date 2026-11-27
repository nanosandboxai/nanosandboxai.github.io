// Shared provider/env resolution for the /agents sandbox.yml builder.
//
// This is the single source of truth for how a (agent, model) pair maps to the
// env vars injected into the generated sandbox.yml. It mirrors the product
// resolver (nanosandbox/scripts/models/providers.py `resolve`) for prefixed
// models, and adds bare-model inference for Aider and Goose so bare model names
// resolve to their natural provider instead of a single fallback key.
//
// The page (AgentsPage.tsx) and the audit script (scripts/audit-agent-env.mjs)
// both import this module, so the audit exercises exactly the page logic.

/**
 * Lowercase a provider prefix and strip any `:*` suffix (e.g. `OpenRouter:free`).
 */
export function normalizePrefix(prefix) {
  return prefix.split(':', 1)[0].toLowerCase()
}

/**
 * Map a provider prefix to its canonical id via the catalog's canonical map.
 * Unmapped prefixes fall back to the normalized prefix itself (identity).
 */
export function canonicalProvider(prefix, canonical) {
  const normalized = normalizePrefix(prefix)
  return canonical[normalized] ?? normalized
}

function overrideSpec(spec) {
  if (Array.isArray(spec)) return { keys: spec, oauth: false }
  return { keys: spec.keys ?? [], oauth: spec.oauth ?? false }
}

function providerCredential(provider, catalog) {
  const creds = catalog.credentials[provider]
  const keys = creds ?? []
  return { provider, keys: [...keys], oauth: provider in catalog.credentials && keys.length === 0 }
}

/**
 * Infer the provider for a bare Aider model (no `/` prefix).
 *
 * Returns only a provider present in `allowedProviders` (the agent's `providers`
 * list); returns null when no rule matches or the inferred provider is not in
 * the allowed set, so the caller falls back to the agent default / AGENT_META.
 */
export function inferBareAiderProvider(model, allowedProviders) {
  const m = model.toLowerCase()
  let provider = null
  // Bedrock model IDs (anthropic.* / eu.anthropic.* / us.anthropic.* / apac.anthropic.*)
  if (/^(anthropic\.|eu\.anthropic\.|us\.anthropic\.|apac\.anthropic\.)/.test(m)) {
    provider = 'bedrock'
  } else if (/^claude-/.test(m) || m === 'sonnet' || m === 'opus' || m === 'haiku') {
    provider = 'anthropic'
  } else if (
    /^(gemini|gemma)/.test(m) ||
    m === 'flash' ||
    m === 'flash-lite' ||
    m === 'pro' ||
    m === 'gemini-flash-latest' ||
    /^gemini-exp/.test(m)
  ) {
    provider = 'gemini'
  } else if (/^command-r/.test(m)) {
    provider = 'cohere'
  } else if (/^deepseek/.test(m)) {
    provider = 'deepseek'
  } else if (m === 'r1') {
    provider = 'deepseek'
  } else if (m === 'optimus' || m === 'quasar') {
    provider = 'openrouter'
  } else if (/^grok/.test(m)) {
    provider = 'xai'
  } else if (/^(mistral|mixtral|codestral|devstral|magistral)/.test(m)) {
    provider = 'mistral'
  } else if (/^(llama|qwen|kimi|glm|phi)/.test(m)) {
    provider = 'openrouter'
  } else if (/^(gpt|o1|o3|o4|chatgpt)/.test(m) || /^[0-9]/.test(m)) {
    provider = 'openai'
  }
  if (provider && allowedProviders.includes(provider)) return provider
  return null
}

/**
 * Infer the provider for a bare Goose model (no `/` prefix).
 *
 * First-party providers (anthropic/google/openai) keep the bare model as
 * GOOSE_MODEL; everything else (databricks/qwen/phi/jev/unknown) is OpenRouter.
 */
export function inferBareGooseProvider(model, allowedProviders) {
  const m = model.toLowerCase()
  let provider = 'openrouter'
  if (/^claude/.test(m)) provider = 'anthropic'
  else if (/^gemini/.test(m)) provider = 'google'
  else if (/^gpt/.test(m)) provider = 'openai'
  if (allowedProviders.includes(provider)) return provider
  return null
}

/**
 * GOOSE_MODEL keeps the full string for openrouter/gateway providers and strips
 * the prefix for first-party ones, matching the product resolve_goose_env.
 */
export function gooseModelValue(provider, model) {
  if (provider === 'openrouter') return model
  if (provider === 'anthropic' || provider === 'openai' || provider === 'google') {
    const idx = model.indexOf('/')
    return idx === -1 ? model : model.slice(idx + 1)
  }
  return model
}

function gooseExtras(agent, provider, model) {
  if (agent !== 'goose' || !provider) return {}
  return { gooseProvider: provider, gooseModel: gooseModelValue(provider, model) }
}

/**
 * Resolve an (agent, model) pair to the env vars the sandbox.yml builder emits.
 *
 * Returns `{ provider, keys, alt, oauth, extras }` or null when the model's
 * provider is not resolvable for that agent. `keys` includes the agent's `alt`
 * keys where the product resolver does; callers filter `alt` out of the active
 * set when comparing. `extras` carries Goose-specific GOOSE_PROVIDER/GOOSE_MODEL.
 */
export function resolveSandboxEnv(catalog, agent, model) {
  const rule = catalog.agents[agent]
  if (!rule) return null
  const mode = rule.mode ?? 'derived'
  const alt = rule.alt ?? []
  const seg = model.includes('/') ? model.split('/', 1)[0] : ''

  if (seg === '') {
    // Bare model: infer the natural provider for Aider/Goose, else fall back to
    // the agent default / collapse_default (preserving the old behavior).
    let provider = null
    if (agent === 'aider') provider = inferBareAiderProvider(model, rule.providers ?? [])
    else if (agent === 'goose') provider = inferBareGooseProvider(model, rule.providers ?? [])

    if (provider) {
      const cred = providerCredential(provider, catalog)
      return { ...cred, alt, extras: gooseExtras(agent, provider, model) }
    }

    let def = rule.default ?? null
    if (def == null && mode === 'collapse') def = rule.collapse_default ?? null
    if (def == null) {
      return { provider: null, keys: [...alt], oauth: false, alt, extras: {} }
    }
    const cred = providerCredential(def, catalog)
    return { ...cred, keys: [...cred.keys, ...alt], alt, extras: gooseExtras(agent, def, model) }
  }

  if (mode === 'collapse') {
    const collapse = rule.collapse ?? {}
    const key = rule.case_sensitive ? seg : seg.toLowerCase()
    const provider = collapse[key] ?? rule.collapse_default ?? null
    if (provider == null) return null
    const cred = providerCredential(provider, catalog)
    return { ...cred, alt, extras: gooseExtras(agent, provider, model) }
  }

  const canon = canonicalProvider(seg, catalog.canonical)
  const overrides = rule.overrides ?? {}
  const segKey = rule.case_sensitive ? seg : seg.toLowerCase()
  if (segKey in overrides) {
    const { keys, oauth } = overrideSpec(overrides[segKey])
    return { provider: null, keys, oauth, alt, extras: {} }
  }
  if (canon in overrides) {
    const { keys, oauth } = overrideSpec(overrides[canon])
    return { provider: null, keys, oauth, alt, extras: {} }
  }
  if ((rule.no_env ?? []).includes(canon)) {
    return { provider: canon, keys: [], oauth: true, alt, extras: {} }
  }
  if (mode === 'derived' || (rule.providers ?? []).includes(canon)) {
    if (canon in catalog.credentials || (rule.no_env ?? []).includes(canon)) {
      const cred = providerCredential(canon, catalog)
      return { ...cred, alt, extras: gooseExtras(agent, canon, model) }
    }
    return null
  }
  return null
}