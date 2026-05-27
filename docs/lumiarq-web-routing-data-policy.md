# Web Routing Data Policy (Phase 1)

## Purpose

Define loader/action/meta data and cache policy rules before runtime implementation to prevent implicit behavior drift.

## Policy Statements

- **Service-over-self-HTTP:** page loaders and actions must call in-process domain services when within same runtime boundary.
- **Cross-boundary HTTP only:** HTTP calls are allowed only for external/public service boundaries.
- **Deterministic envelopes:** page data must resolve into `{ initialData, meta, revalidate, pageVersion }`.
- **Serialization safety-first:** contract payloads must be JSON-safe and explicitly reject non-serializable values.

## Revalidation Policy Model

- `static`: immutable page data until explicit invalidation event.
- `timeWindow(seconds)`: stale-by-time and eligible for re-fetch on next request.
- `always`: recompute on each request.

## Invalidation Semantics

- Domain writes from actions should emit cache invalidation events keyed by route scope.
- Invalidation keys should be route-group oriented to support migration feature flags.
- Cross-slice invalidation must be explicit and audited.

## Data Ownership Rules

- Loaders own read-model assembly for page render.
- Actions own state transition and post-write invalidation intent.
- Meta resolvers own title/description/canonical metadata only.

## Security and Compliance Constraints

- Escape and encode output at render boundary; contract does not permit raw HTML injection in data payloads.
- Sensitive fields must be omitted from `initialData`.
- Contract fixtures must include negative tests for unsafe serialization.

## Acceptance Gates

- Policy is referenced by RFC and conformance suite plan.
- Revalidation and invalidation semantics are testable from contract fixtures.
- Service-over-self-HTTP rule is reflected in migration governance checks.
