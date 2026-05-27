# Web Routing Migration Governance and Rollback

## Purpose

Provide a low-risk cutover process from legacy Tepuledia route handlers to contract-driven web routing with explicit rollback controls.

## Governance Model

- Migrate by vertical slice only (for example: `messages`, `notifications`).
- Keep legacy `Route.*` route declarations active until slice-level signoff.
- Use route-group feature flags to control cutover eligibility.

## Pre-Cutover Checklist

- Contract fixtures approved for selected slice.
- Data policy compliance verified (service-over-self-HTTP and serialization safety).
- Conformance suite plan mapped for slice-specific tests.
- Consumer pin baseline captured from `ecosystem/framework/docs/consumer-pins.json`.

## Cutover Procedure

1. Select one slice and define owner plus rollback owner.
2. Enable feature flag for non-critical traffic cohort.
3. Execute parity checks against baseline route behavior and middleware/auth flow.
4. Verify TTFB, response shape, and render output parity against baseline references.
5. Expand cohort only if all P0 checks pass.

## Rollback Procedure

1. Trigger rollback on any P0 failure (auth, middleware, render, serialization, or severe performance regression).
2. Disable route-group feature flag immediately.
3. Route requests back through existing legacy handlers and cached route loader path.
4. Capture incident note with failing route, timestamp, and regression class.
5. Require remediation PR plus revalidation checklist before reattempt.

## Acceptance Gates

- Each migrated slice has signed cutover and rollback owners.
- Rollback drill is executed once per slice before full rollout.
- No consumer pin changes are made until runtime/core and adapter gates are green.

## Dependencies For Next Phases

- Runtime bridge implementation with deterministic route ranking.
- Feature-flag infrastructure for route-group gating.
- Codemod strategy and migration guide once bridge stabilizes.
