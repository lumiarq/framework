#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

violations=()

check_tree() {
  local label="$1"
  local find_root="$2"
  while IFS= read -r js_file; do
    local ts_file="${js_file%.js}.ts"
    local tsx_file="${js_file%.js}.tsx"
    if [[ -f "$ts_file" || -f "$tsx_file" ]]; then
      violations+=("$js_file")
    fi
  done < <(
    find "$find_root" -name '*.js' \
      -not -path '*/dist/*' \
      -not -path '*/node_modules/*' \
      -not -path '*/scripts/*'
  )
}

check_tree 'packages/illumiarq' packages/illumiarq
check_tree 'src (meta-package)' src
check_tree 'packages/tools' packages/tools

if ((${#violations[@]} > 0)); then
  echo "Source JS drift detected (${#violations[@]} files with matching .ts/.tsx siblings):"
  printf '  %s\n' "${violations[@]}"
  exit 1
fi

echo "No source-level JS drift in packages/illumiarq, src/, or packages/tools."
