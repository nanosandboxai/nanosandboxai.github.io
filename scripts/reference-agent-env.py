#!/usr/bin/env python3
"""Independent reference for the /agents sandbox.yml env resolution.

Computes the expected `{provider, keys, oauth, gooseProvider, gooseModel}` for
every (agent, model) in the product models.json. For prefixed models it uses the
product resolver (nanosandbox/scripts/models/providers.py `resolve`); for bare
Aider/Goose models it applies the reviewed bare-model inference table. This is a
separate implementation from the web resolver so the audit can cross-check it.

Outputs a JSON object keyed by agent -> model -> resolution to stdout.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO / "scripts" / "models"))

import providers  # noqa: E402


def goose_model_value(provider: str, model: str) -> str:
    if provider == "openrouter":
        return model
    if provider in ("anthropic", "openai", "google"):
        idx = model.find("/")
        return model if idx == -1 else model[idx + 1 :]
    return model


def infer_bare_aider(model: str, allowed: list[str]) -> str | None:
    m = model.lower()
    provider = None
    if m.startswith(("anthropic.", "eu.anthropic.", "us.anthropic.", "apac.anthropic.")):
        provider = "bedrock"
    elif m.startswith("claude-") or m in ("sonnet", "opus", "haiku"):
        provider = "anthropic"
    elif (
        m.startswith(("gemini", "gemma"))
        or m in ("flash", "flash-lite", "pro", "gemini-flash-latest")
        or m.startswith("gemini-exp")
    ):
        provider = "gemini"
    elif m.startswith("command-r"):
        provider = "cohere"
    elif m.startswith("deepseek"):
        provider = "deepseek"
    elif m == "r1":
        provider = "deepseek"
    elif m in ("optimus", "quasar"):
        provider = "openrouter"
    elif m.startswith("grok"):
        provider = "xai"
    elif m.startswith(("mistral", "mixtral", "codestral", "devstral", "magistral")):
        provider = "mistral"
    elif m.startswith(("llama", "qwen", "kimi", "glm", "phi")):
        provider = "openrouter"
    elif m.startswith(("gpt", "o1", "o3", "o4", "chatgpt")) or m[:1].isdigit():
        provider = "openai"
    if provider and provider in allowed:
        return provider
    return None


def infer_bare_goose(model: str, allowed: list[str]) -> str | None:
    m = model.lower()
    provider = "openrouter"
    if m.startswith("claude"):
        provider = "anthropic"
    elif m.startswith("gemini"):
        provider = "google"
    elif m.startswith("gpt"):
        provider = "openai"
    if provider in allowed:
        return provider
    return None


def credential(provider: str, catalog: dict) -> dict:
    keys = list(catalog["credentials"].get(provider, []))
    oauth = provider in catalog["credentials"] and not keys
    return {"provider": provider, "keys": keys, "oauth": oauth}


def resolve_one(agent: str, model: str, catalog: dict) -> dict:
    rule = catalog["agents"][agent]
    mode = rule.get("mode", "derived")
    alt = list(rule.get("alt", []))
    seg = model.split("/", 1)[0] if "/" in model else ""

    if seg == "":
        provider = None
        if agent == "aider":
            provider = infer_bare_aider(model, rule.get("providers", []))
        elif agent == "goose":
            provider = infer_bare_goose(model, rule.get("providers", []))
        if provider:
            cred = credential(provider, catalog)
            cred["alt"] = alt
            if agent == "goose":
                cred["gooseProvider"] = provider
                cred["gooseModel"] = goose_model_value(provider, model)
            else:
                cred["gooseProvider"] = None
                cred["gooseModel"] = None
            return cred
        default = rule.get("default")
        if default is None and mode == "collapse":
            default = rule.get("collapse_default")
        if default is None:
            return {
                "provider": None,
                "keys": list(alt),
                "oauth": False,
                "alt": alt,
                "gooseProvider": None,
                "gooseModel": None,
            }
        cred = credential(default, catalog)
        cred["keys"] = cred["keys"] + alt
        cred["alt"] = alt
        if agent == "goose":
            cred["gooseProvider"] = default
            cred["gooseModel"] = goose_model_value(default, model)
        else:
            cred["gooseProvider"] = None
            cred["gooseModel"] = None
        return cred

    if mode == "collapse":
        collapse = rule.get("collapse", {})
        key = seg if rule.get("case_sensitive") else seg.lower()
        provider = collapse.get(key) or rule.get("collapse_default")
        if provider is None:
            return None
        cred = credential(provider, catalog)
        cred["alt"] = alt
        cred["gooseProvider"] = provider if agent == "goose" else None
        cred["gooseModel"] = goose_model_value(provider, model) if agent == "goose" else None
        return cred

    # Prefixed, non-collapse: use the authoritative product resolver.
    resolved = providers.resolve(agent, model)
    if resolved is None:
        return None
    return {
        "provider": resolved["provider"],
        "keys": list(resolved["keys"]),
        "oauth": bool(resolved["oauth"]),
        "alt": alt,
        "gooseProvider": resolved["provider"] if agent == "goose" else None,
        "gooseModel": goose_model_value(resolved["provider"], model) if agent == "goose" else None,
    }


def main() -> None:
    models_path = REPO / "registries" / "models" / "models.json"
    catalog_path = REPO / "registries" / "models" / "provider-catalog.json"
    models = json.loads(models_path.read_text(encoding="utf-8"))["agents"]
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))

    out: dict[str, dict] = {}
    for agent, entry in models.items():
        out[agent] = {}
        for model in entry["models"]:
            out[agent][model] = resolve_one(agent, model, catalog)
    print(json.dumps(out, sort_keys=True))


if __name__ == "__main__":
    main()