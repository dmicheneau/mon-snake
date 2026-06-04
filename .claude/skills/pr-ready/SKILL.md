---
name: pr-ready
description: Vérifie qu'une branche est prête à être ouverte en Merge Request — tests, lint, fichiers non commités, retard sur main. Utilise quand vous vous apprêtez à pousser une branche ou ouvrir une Merge Request.
compatibility: Requiert git, et selon le projet : npm/pytest/go test, eslint/ruff/golangci-lint
allowed-tools: Bash(.claude/skills/pr-ready/scripts/check.sh:*)
---
## Workflow

1. Lance `.claude/skills/pr-ready/scripts/check.sh`
2. Lis le rapport produit
3. Pour chaque point bloquant, explique le problème et propose la commande corrective
4. Si tout est vert, confirme que la branche est prête et rappelle la commande de push

## Ce que le script vérifie

- **Working tree** — fichiers modifiés non stagés ou non commités
- **Retard sur main** — nombre de commits derrière `origin/main`
- **Tests** — détecte automatiquement npm, pytest ou go test selon le projet
- **Lint** — détecte eslint, ruff ou golangci-lint selon le projet

## Interpréter le rapport

Le script retourne `exit 0` si tout est propre, `exit 1` si au moins un point échoue.
Chaque section du rapport est préfixée par `[OK]`, `[WARN]` ou `[FAIL]`.

