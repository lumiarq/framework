# Lumiarq Agnostic Web Routing RFC (Phase 1 Handoff)

## Status

- Proposed for Phase 1 execution.
- Scope is limited to contracts and planning artifacts only.
- Runtime behavior changes are out of scope in this phase.

## Baseline References (Current Tepuledia)

- Route declaration baseline: `projects/Tepuledia/app/src/modules/Shell/http/routes/app.web.ts`
- Cached route bootstrap: `projects/Tepuledia/app/src/storage/framework/cache/routes.loader.ts`
- Bootstrap entrypoint: `projects/Tepuledia/app/bootstrap/entry.ts`
- Current server render seam: `projects/Tepuledia/app/src/shared/ui/lib/render-page.ts`
- Consumer rollout pins: `ecosystem/framework/docs/consumer-pins.json`

## Goals

- Define framework-agnostic web runtime contracts for route/page execution.
- Preserve `Route.get(...)` parity via a bridge-first migration model.
- Lock down data and revalidation policy before runtime implementation.
- Establish conformance suite scaffolding and migration governance.

## Non-Goals

- No runtime resolver or manifest builder implementation in this phase.
- No filesystem routing runtime (`src/app`) execution in this phase.
- No adapter GA/Beta implementation in this phase.
- No changes to existing Tepuledia request behavior in this phase.

## Contract Envelope (Design Only)

- New neutral page contract interfaces are introduced in `@illumiarq/contracts`.
- Contracts define `PageModule`, `RenderRequest`, `RenderResult`, loader/action/meta signatures, and revalidation hints.
- Contracts are intentionally design-time and do not wire into runtime pipeline yet.

## Compatibility Matrix (Planned)

| Surface         | Current Tepuledia                            | Phase 1 Contract Expectation                  |
| --------------- | -------------------------------------------- | --------------------------------------------- |
| Legacy routes   | `Route.get/post` in route files              | Supported via bridge contract                 |
| Route cache     | `lumis route:cache` generated loader imports | Must remain canonical source during migration |
| SSR render seam | `renderPage(title, body)`                    | Preserved via `RenderResult` HTML contract    |
| Consumer pins   | `consumer-pins.json`                         | Must be unchanged until implementation phases |

## Acceptance Gates

- **Gate A (Contracts):** `@illumiarq/contracts` exports new web runtime contract interfaces and package typecheck passes.
- **Gate B (Proveability plan):** A 2-week spike plan exists with measurable KPIs, parity checklist, and exit criteria.
- **Gate C (Data policy):** Revalidation and service-over-self-HTTP policy is explicit, testable, and linked to future conformance tests.
- **Gate D (Conformance plan):** Adapter and serialization/hydration test-spec scaffolding exists with GA/Beta criteria.
- **Gate E (Migration governance):** Feature-flag cutover and rollback playbook is documented per slice.

## Migration and Rollback Procedure (Governance-Level)

1. Enable a route-group feature flag for one vertical slice only.
2. Run parity checklist against baseline route behavior and middleware/auth expectations.
3. If any P0 parity check fails, disable slice flag and route traffic back to legacy `Route.*` handlers.
4. Keep `routes.loader.ts` legacy imports as rollback-safe fallback until slice signoff.
5. Document rollback reason, impacted route group, and follow-up actions before retry.

## Open Dependencies For Next Phases

- Runtime-core package boundary decision (`@illumiarq/runtime` extension vs new `@lumiarq/web-runtime` package).
- Route ranking deterministic algorithm specification owner.
- Adapter owners for React/Vue GA and Beta framework tracks.
- Final metric source-of-truth for TTFB and hydration mismatch telemetry.
