#!/usr/bin/env bash
set -euo pipefail

# Se positionner dans le répertoire du projet
PROJECT_DIR="${1:-$PWD}"
cd "$PROJECT_DIR"

# Remonter à la racine Git si on est dans un sous-dossier
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || {
  echo "[FAIL] Aucun dépôt Git trouvé dans $PROJECT_DIR"
  exit 1
}
cd "$GIT_ROOT"

FAIL=0

ok()   { echo "[OK]   $1"; }
warn() { echo "[WARN] $1"; }
fail() { echo "[FAIL] $1"; FAIL=$((FAIL + 1)); }

echo "=== PR Readiness Check ==="
echo ""

# 1. Working tree propre ?
echo "--- Working tree ---"
if [[ -n "$(git status --porcelain)" ]]; then
  fail "Fichiers non commités détectés :"
  git status --short
else
  ok "Working tree propre"
fi
echo ""

# 2. Retard sur main ?
echo "--- Synchro avec origin/main ---"
git fetch origin main --quiet 2>/dev/null || warn "Impossible de contacter origin"
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "0")
if [[ "$BEHIND" -gt 0 ]]; then
  fail "Branche en retard de $BEHIND commit(s) sur origin/main"
else
  ok "À jour avec origin/main"
fi
echo ""

# 3. Tests
echo "--- Tests ---"
if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
  if npm test --silent 2>&1 | tail -5; then
    ok "Tests npm passés"
  else
    fail "Tests npm échoués"
  fi
elif [[ -f "pytest.ini" ]] || [[ -f "pyproject.toml" ]]; then
  if python -m pytest -q 2>&1 | tail -5; then
    ok "Tests pytest passés"
  else
    fail "Tests pytest échoués"
  fi
elif [[ -f "go.mod" ]]; then
  if go test ./... -count=1 2>&1 | tail -5; then
    ok "Tests Go passés"
  else
    fail "Tests Go échoués"
  fi
else
  warn "Aucun runner de tests détecté"
fi
echo ""

# 4. Lint
echo "--- Lint ---"
if command -v eslint &>/dev/null; then
  if eslint . --max-warnings=0 --quiet 2>&1 | tail -3; then
    ok "ESLint propre"
  else
    fail "ESLint signale des erreurs"
  fi
elif command -v ruff &>/dev/null; then
  if ruff check . 2>&1 | tail -3; then
    ok "Ruff propre"
  else
    fail "Ruff signale des erreurs"
  fi
elif command -v golangci-lint &>/dev/null; then
  if golangci-lint run 2>&1 | tail -3; then
    ok "golangci-lint propre"
  else
    fail "golangci-lint signale des erreurs"
  fi
else
  warn "Aucun linter détecté"
fi
echo ""

# Bilan
echo "=========================="
if [[ "$FAIL" -gt 0 ]]; then
  echo "Résultat : $FAIL point(s) bloquant(s)"
  exit 1
else
  echo "Résultat : branche prête"
  exit 0
fi

