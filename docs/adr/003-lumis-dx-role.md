# ADR-003: Lumis role — DX and AI layer, not runtime host

**Status:** Accepted  
**Date:** 2026-05-27

## Context

Two packages publish under similar names:

| npm package                    | Role                                               | Source                                         |
| ------------------------------ | -------------------------------------------------- | ---------------------------------------------- |
| `@illumiarq/lumis` ≥ 1.2.11    | App dev CLI (`serve`, `route:cache`, Vercel build) | `ecosystem/framework/packages/illumiarq/lumis` |
| `@illumiarq/lumis` 1.2.10 line | Multi-pack AI agent CLI                            | `ecosystem/lumis`                              |
| `@lumiarq/lumis`               | Agent runtime (transitive)                         | `ecosystem/lumis`                              |
| `@lumiarq/ai`                  | Provider gateway for agents                        | `ecosystem/lumis/packages/ai`                  |

Developer confusion undermines “goto framework” positioning.

## Decision

1. **Lumiarq runtime** — Request handling, modules, handlers, and deploy adapters live in `@illumiarq/*` + `@lumiarq/framework`. Lumis does not host HTTP or replace the framework kernel.
2. **Lumis responsibilities** — Scaffolding (`init`), hygiene (`doctor`), test/serve proxies, AI-assisted packs, verifier, progress checkpoints (`.lumis/progress/`).
3. **App dependency rule** — Lumiarq apps pin `@illumiarq/lumis` dev CLI (≥ 1.2.11) per [PACKAGE_NAMING.md](../PACKAGE_NAMING.md). Agent CLI rename to `@illumiarq/lumis-cli` is **post-M1**, not blocking universal alignment.
4. **Verifier alignment** — Over time, `lumis doctor` should flag portable-core violations (ADR-001) and root config clutter (Wave 2), not only Vercel/env issues.

## Consequences

- Universal alignment work prioritizes **framework core + contracts**, parallel to Lumis DX MVP (`init` / `doctor`), not agent pack parity.
- AI provider abstraction (`@lumiarq/ai`) is the pilot for **conditional exports** (M4), not the application HTTP stack.

## Alternatives considered

- **Merge agent CLI into framework lumis** — Rejected short-term; different release cadence and dependency graph.
- **Lumis as universal runtime** — Rejected; violates separation of DX tooling and deployable app kernel.
