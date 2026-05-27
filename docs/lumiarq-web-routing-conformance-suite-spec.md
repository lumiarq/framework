# Web Routing Conformance Suite Spec Scaffold (Phase 1)

## Objective

Create a test-spec scaffold that adapter and runtime implementation phases must satisfy without implementing runtime logic yet.

## Test Tracks

- **Contract track:** validates `PageModule` signatures and payload envelope invariants.
- **Bridge parity track:** validates legacy route parity during migration.
- **Serialization/security track:** validates JSON-safe payloads and escaping constraints.
- **Hydration checksum track:** validates SSR/client payload consistency where hydration is enabled.

## Planned Suite Layout

- `contracts/page-module.spec.ts` (signature and envelope fixtures)
- `bridge/parity-route-behavior.spec.ts` (legacy vs bridge response parity)
- `security/serialization-safety.spec.ts` (unsafe payload rejection)
- `hydration/checksum.spec.ts` (adapter hydration integrity)

## Adapter Matrix

| Adapter | Stage | Required Gates                                    |
| ------- | ----- | ------------------------------------------------- |
| React   | GA    | All tracks mandatory                              |
| Vue     | GA    | All tracks mandatory                              |
| Svelte  | Beta  | Contract + security mandatory, hydration advisory |
| Solid   | Beta  | Contract + security mandatory, hydration advisory |
| Qwik    | Beta  | Contract + security mandatory, hydration advisory |

## Acceptance Gates

- Matrix and suite structure approved before adapter implementation starts.
- Every gate maps to at least one explicit spec file.
- Fail-fast criteria documented for parity, serialization, and hydration mismatch.

## Handoff Inputs Required

- Runtime contract source from `@illumiarq/contracts`.
- Data policy from `ecosystem/framework/docs/lumiarq-web-routing-data-policy.md`.
- Migration route slices from governance plan.
