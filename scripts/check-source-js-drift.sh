#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

violations=()

while IFS= read -r js_file; do
  ts_file="${js_file%.js}.ts"
  if [[ -f "$ts_file" ]]; then
    violations+=("$js_file")
  fi
done < <(
  find packages/illumiarq -name '*.js' \
    -not -path '*/dist/*' \
    -not -path '*/node_modules/*' \
    -not -path '*/scripts/*'
)

if ((${#violations[@]} > 0)); then
  echo "Source JS drift detected (${#violations[@]} files with matching .ts siblings):"
  printf '  %s\n' "${violations[@]}"
  exit 1
fi

echo "No source-level JS drift in packages/illumiarq."
