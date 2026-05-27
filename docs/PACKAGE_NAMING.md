# Package naming and app dependencies

## Namespace layout (Illuminate-style)

| Scope          | Role                                    | Example                                                    |
| -------------- | --------------------------------------- | ---------------------------------------------------------- |
| `@illumiarq/*` | Framework primitives (Illuminate layer) | `@illumiarq/core`, `@illumiarq/http`, `@illumiarq/runtime` |
| `@lumiarq/*`   | Meta-framework and product bundles      | `@lumiarq/framework`, `@lumiarq/eslint-plugin`             |
| `@trazze/*`    | Observability                           | `@trazze/sdk`, `@trazze/ignite`                            |

`@velo/*` is **retired**. Do not add new references. Historical docs may mention it during migration.

## What application code should import

**Runtime and types:** `@lumiarq/framework` (and subpaths such as `@lumiarq/framework/database`).

**Do not import** `@illumiarq/*` directly in application modules — enforced by `@lumiarq/eslint-plugin` (`no-framework-subpackage-import`).

## What `package.json` may list

| Package                | Typical role                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `@lumiarq/framework`   | `dependencies` — runtime API                                                                    |
| `@illumiarq/lumis`     | `devDependencies` — **app dev CLI** (`lumis serve`, `route:cache`, Vercel build). See below.    |
| `@lumiarq/lumis`       | Transitive — base agent runtime used by the app CLI; do not add to apps directly unless needed. |
| `@illumiarq/adapters`  | `dependencies` — only when the deploy target needs an explicit adapter entry                    |
| `@illumiarq/contracts` | `dependencies` — optional; prefer `@lumiarq/framework/contracts` when possible                  |

Mixed `@illumiarq` + `@lumiarq` in `package.json` is normal; mixed **imports in app source** are not.

## `@illumiarq/lumis` on npm — two publish sources, one name

The npm package `@illumiarq/lumis` is published from **two repos**. Check `npm view @illumiarq/lumis@<version> description` before upgrading:

| Version line         | Description on npm                                                      | Source                                         | Use in Lumiarq apps?                               |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------- |
| **1.2.11** (app CLI) | `LumiARQ dev CLI — extends @lumiarq/lumis with serve / build / preview` | `ecosystem/framework/packages/illumiarq/lumis` | **Yes** — pin `^1.2.11`                            |
| **1.2.10** (agent)   | `Lumis — multi-pack AI coding agent CLI`                                | `ecosystem/lumis`                              | **No** for app builds — no `route:cache` / `serve` |

Lumiarq and lumiarq.com must depend on **≥ 1.2.11** with the dev CLI description. Do not assume `latest` (1.2.10 agent) is correct.

## Local workspace / `lumis serve` pitfalls

- Published entrypoints resolve to `dist/` only (`package.json` `exports` → `./dist/*`).
- Stale `src/*.js` next to `src/*.ts` breaks resolution if those files are present — CI runs `scripts/check-source-js-drift.sh` to prevent this.
- After linking the framework workspace, run `pnpm build` in `ecosystem/framework` so `dist/` matches `src/*.ts`.
