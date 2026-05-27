# ADR-001: Portable core vs Node affordances

**Status:** Accepted (M2 gate: `/node` subpath shipped)  
**Date:** 2026-05-27

## Context

The Lumiarq universal architecture requires a **WinterCG-aligned portable core** that can run on Workers, Bun, Deno, and future mobile/desktop hosts without silent breakage. Today `@illumiarq/core` mixes portable primitives with Node-only filesystem helpers.

Known Node-only modules (as of this ADR):

- `src/config/resolve-tool-config.ts` — `node:fs`, `node:path`
- `src/content/define-content-loader.ts` — `node:fs`, `node:path`
- `src/crypto/index.ts`, `src/http/request-id.ts`, `src/event/event-bus.ts` — `node:crypto` (Web Crypto migration tracked)
- `src/testing/test-transaction.ts` — `node:async_hooks` (test-only)

These are exported from `@illumiarq/core/node` only. `@lumiarq/framework` re-exports them for app code. The portable `.` entry must not re-export Node-only modules.

## Decision

1. **Portable surface** — Domain primitives, contracts-shaped helpers, HTTP utilities that use only Web-standard or isomorphic APIs (`parseRequestUrl`, `headersToRecord`, `IRequest`, events, actions, modules).
2. **Node surface** — Filesystem config resolution, content directory scanning, and any API using `node:*`, `process.*`, or `child_process` live outside the portable compile graph.
3. **CI gate** — `tests/portable-surface.test.ts` fails if new `node:fs` / `node:path` / `process.` usage appears outside an explicit allowlist.
4. **Portable typecheck** — `pnpm run typecheck:portable` in `@illumiarq/core` uses `tsconfig.portable.json` (no `@types/node`) for files on the portable allowlist.

## Consequences

- Apps on Node import `@illumiarq/core` + Node subpath until split is complete.
- New platform adapters depend on **M2** (portable gate green), not on deployment adapters alone.
- Marketing “runs everywhere” is valid only after M2; server/edge remains the shipped story until then.

## Alternatives considered

- **Single package with conditional exports only** — Rejected for phase 1; need explicit CI allowlist before conditional builds are trustworthy.
- **Move all config to Lumis CLI** — Rejected; runtime apps must resolve tool configs without the CLI.
