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

| Package                | Typical role                                                                   |
| ---------------------- | ------------------------------------------------------------------------------ |
| `@lumiarq/framework`   | `dependencies` — runtime API                                                   |
| `@illumiarq/lumis`     | `devDependencies` — CLI (`lumis serve`, generators)                            |
| `@illumiarq/adapters`  | `dependencies` — only when the deploy target needs an explicit adapter entry   |
| `@illumiarq/contracts` | `dependencies` — optional; prefer `@lumiarq/framework/contracts` when possible |

Mixed `@illumiarq` + `@lumiarq` in `package.json` is normal; mixed **imports in app source** are not.

## Local workspace / `lumis serve` pitfalls

- Published entrypoints resolve to `dist/` only (`package.json` `exports` → `./dist/*`).
- Stale `src/*.js` next to `src/*.ts` breaks resolution if those files are present — CI runs `scripts/check-source-js-drift.sh` to prevent this.
- After linking the framework workspace, run `pnpm build` in `ecosystem/framework` so `dist/` matches `src/*.ts`.
