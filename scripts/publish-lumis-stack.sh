#!/usr/bin/env bash
# Publish @lumiarq/lumis (agent host) then @illumiarq/lumis (app CLI) with semver deps.
# Requires: export NPM_TOKEN=... and npm login scope access for @illumiarq + @lumiarq
set -euo pipefail

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "Set NPM_TOKEN before running." >&2
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LUMIS_AGENT="${ROOT}/../lumis"

echo "→ Building agent CLI (@lumiarq/lumis)…"
cd "$LUMIS_AGENT"
pnpm install
pnpm run build
node scripts/publish.mjs --publish

echo "→ Building app CLI (@illumiarq/lumis)…"
cd "$ROOT"
echo "  (Remove pnpm.overrides @lumiarq/lumis link:../lumis from package.json before publish if present.)"
pnpm install
pnpm --filter @illumiarq/lumis run build
pnpm --filter @illumiarq/lumis publish --access public --no-git-checks

echo "✓ Lumis stack published. Bump consumer-pins.json overrides to match npm view versions."
