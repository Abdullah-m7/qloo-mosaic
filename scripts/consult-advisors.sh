#!/usr/bin/env bash
# MOSAIC advisory board: on-demand, independent, read-only model reviews.
# No model run occurs in --dry-run mode. No report is committed or published.
set -euo pipefail
umask 077
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PRIVATE_ROOT="${HOME}/.config/qloo-mosaic/advisory-reviews"
usage() {
  printf 'Usage: bash scripts/consult-advisors.sh {--dry-run|astra|fable|both}\n' >&2
  exit 2
}
mode="${1:---dry-run}"
[[ "$#" -eq 1 ]] || usage
case "$mode" in --dry-run|astra|fable|both) ;; *) usage ;; esac
command -v git >/dev/null || { echo "git unavailable" >&2; exit 3; }
test -f "$ROOT/advisors/ASTRA.md" && test -f "$ROOT/advisors/FABLE.md" || {
  echo "Advisor prompts missing" >&2; exit 4;
}
# Project scope and exact repo identity, do not consult from unrelated projects.
repo="$(git -C "$ROOT" config --get remote.origin.url || true)"
case "$repo" in
  *Abdullah-m7/qloo-mosaic.git|*Abdullah-m7/qloo-mosaic) ;;
  *) echo "Wrong project repository; refusing consultation" >&2; exit 5 ;;
esac
if [[ "$mode" == "--dry-run" ]]; then
  command -v codex >/dev/null && echo "Astra: gpt-6-astra via Codex CLI (available)" || echo "Astra CLI unavailable"
  command -v claude >/dev/null && echo "Fable: fable via Claude Code CLI (available)" || echo "Fable CLI unavailable"
  echo "Scope: Abdullah-m7/qloo-mosaic only"
  echo "Permissions: advisory read-only, no auto-push/deploy/submission"
  echo "Reports: private local folder outside Git"
  echo "No model inference was run"
  exit 0
fi

mkdir -p "$PRIVATE_ROOT"
chmod 700 "$PRIVATE_ROOT"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
folder="$PRIVATE_ROOT/$stamp"
mkdir -p "$folder"
chmod 700 "$folder"
head_sha="$(git -C "$ROOT" rev-parse --short HEAD)"
branch="$(git -C "$ROOT" branch --show-current)"
printf 'Project qloo-mosaic, branch %s, commit %s; reports are local and private.\n' "$branch" "$head_sha"
# Review reports are independent. Never show one model the other's output.
run_astra() {
  command -v codex >/dev/null || { echo "Astra unavailable (Codex CLI missing)" >&2; return 7; }
  local result="$folder/astra.md"
  if ! (cd "$ROOT" && codex exec --ephemeral --sandbox read-only \
      --model gpt-6-astra -c model_reasoning_effort=medium \
      --cd "$ROOT" --output-last-message "$result" - \
      < "$ROOT/advisors/ASTRA.md") > "$folder/astra.log" 2>&1; then
    echo "Astra model review failed; see local private log (no substitution)" >&2
    return 8
  fi
  test -s "$result" || { echo "Astra returned no report" >&2; return 9; }
  chmod 600 "$result" "$folder/astra.log"
  echo "Astra report saved privately."
}
run_fable() {
  command -v claude >/dev/null || { echo "Fable unavailable (Claude Code CLI missing)" >&2; return 10; }
  local result="$folder/fable.md"
  if ! (cd "$ROOT" && claude -p --model fable \
      --permission-mode plan --tools Read,Glob,Grep \
      --max-turns 6 --max-budget-usd 2 \
      --output-format text < "$ROOT/advisors/FABLE.md" > "$result") \
      > "$folder/fable.log" 2>&1; then
    echo "Fable model review failed or reached the cost cap; do not substitute" >&2
    return 11
  fi
  test -s "$result" || { echo "Fable returned no report" >&2; return 12; }
  chmod 600 "$result" "$folder/fable.log"
  echo "Fable report saved privately."
}
case "$mode" in
  astra) run_astra ;;
  fable) run_fable ;;
  both)
    failure=0
    run_astra || failure=1
    run_fable || failure=1
    (( failure == 0 )) || exit 13
    ;;
esac
printf 'Done. Private review folder: %s\n' "$folder"
