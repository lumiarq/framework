# ADR-002: Adapter taxonomy — deployment vs capability

**Status:** Accepted  
**Date:** 2026-05-27

## Context

Lumiarq already ships **deployment/runtime adapters** (`@illumiarq/adapters`: `node`, `vercel`, `cloudflare`, `fetch`, `aws-lambda`, `static`). The universal spec also describes **platform capability adapters** (storage, filesystem, notifications) shared across web, mobile, and desktop.

Conflating the two causes “we have adapters” to mean “we are universal” when only server/edge deploy paths are covered.

## Decision

### Deployment adapters (exists today)

Answer: **Where does the HTTP app run?**  
Examples: Node server, Vercel serverless, Cloudflare Workers, static export.  
Location: `@illumiarq/adapters`  
Contracts: boot, request routing, env, build output.

### Capability adapters (target — M3+)

Answer: **How does domain code access I/O?**  
Examples: `KeyValueStorage`, `Filesystem`, push notifications, secure storage.  
Location: future `@illumiarq/adapters-capability` or `packages/illumiarq/adapters-capability/`  
Contracts: extend/evolve `@illumiarq/contracts` with platform-neutral names.

First capability implementations (ordered):

1. `memory` — tests and default
2. `node-fs` — server
3. One non-Node pilot (e.g. `browser-local-storage` or worker KV) — only after M2

### Security baseline (Wave 3 MVP)

Doctor and runtime checks cover **supply chain and env hygiene** at the DX layer. Full verifier auth/session parity is not a gate for M2.

## Consequences

- Documentation and roadmap use “deployment adapter” vs “capability adapter” explicitly.
- `@lumiarq/framework` remains the app-facing meta-package; apps do not import `@illumiarq/*` directly (see PACKAGE_NAMING.md).
- React Native / Tauri / desktop IPC are **out of scope** until M3 capability contracts ship with tests.

## Alternatives considered

- **One adapter package for everything** — Rejected; couples deploy lifecycle to KV/filesystem versioning.
- **Skip contracts; use concrete Node APIs in core** — Rejected; blocks universal core (ADR-001).
