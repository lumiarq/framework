# Lumiarq production support matrix

## Supported for production apps

| Package                  | Pin               | Role                                  |
| ------------------------ | ----------------- | ------------------------------------- |
| `@lumiarq/framework`     | `1.0.6`           | Meta-framework entry                  |
| `@illumiarq/lumis`       | `1.3.0`           | App CLI (`serve`, `build`, `preview`) |
| `@illumiarq/runtime`     | `1.2.0`           | HTTP/runtime core                     |
| `@illumiarq/contracts`   | `1.2.0`           | Portable contracts                    |
| `@illumiarq/adapters`    | `1.2.0`           | Node / CF / static adapters           |
| `@illumiarq/testing`     | `1.2.0`           | Test harness                          |
| Remaining `@illumiarq/*` | `1.1.5` / `0.1.1` | See `consumer-pins.json`              |

**Node:** 20.x · **Package manager:** pnpm 9+

## Install contract

```bash
pnpm add @lumiarq/framework @illumiarq/lumis
```

Copy `pnpm.overrides` from [`consumer-pins.json`](./consumer-pins.json) so transitive versions stay aligned.

- Use **`@illumiarq/lumis`** in app `devDependencies` for `lumis serve`.
- Do **not** replace `@lumiarq/lumis` with `@illumiarq/lumis` — they are different packages.

## Preview (not GA)

- `src/app` filesystem routing — enable with `LUMIARQ_WEB_RUNTIME_FS=1`
- Svelte / Solid / Qwik web adapters — beta behind conformance gates
- `@lumiarq/lumis` agent CLI — optional; for AI-assisted workflows only

## Verification gates (match CI)

```bash
pnpm tc && pnpm lint && pnpm test && pnpm build
```

## Security

Report issues privately to the maintainers; do not file public issues for undisclosed vulnerabilities.
