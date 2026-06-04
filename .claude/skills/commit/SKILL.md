---
name: commit
description: Crée un commit Git avec un message au format conventionnel en français, après une revue de code automatique des fichiers modifiés. Utiliser impérativement ce skill à chaque fois que l'utilisateur veut commiter, sauvegarder, ou valider ses changements — même s'il dit juste "commit" ou "sauvegarde ça". Le skill bloque le commit si des problèmes sont détectés et les corrige automatiquement avant de procéder.
argument-hint: <description courte du changement>
---

## Objectif

Garantir que chaque commit est propre : les fichiers modifiés sont revus, les problèmes bloquants corrigés automatiquement, puis le commit est créé avec un message conventionnel en français.

## Workflow

### Étape 1 — Identifier les changements

1. Lance `git diff --staged` pour voir les fichiers indexés
2. Si rien n'est indexé, lance `git status` et `git diff` pour voir les changements non indexés
3. Propose à l'utilisateur quels fichiers indexer, puis exécute `git add` après validation
4. Si toujours rien à commiter, informe l'utilisateur et arrête

### Étape 2 — Revue de code des fichiers modifiés

Avant tout commit, lire attentivement le diff complet (`git diff --staged`) et examiner chaque fichier modifié pour détecter des problèmes. L'objectif est d'attraper ce qu'un développeur expérimenté remarquerait immédiatement en relisant son propre code.

**Problèmes bloquants** (corrigés automatiquement avant de continuer) :

- **Bugs évidents** : conditions toujours vraies/fausses, variables utilisées avant initialisation, cas limite non gérés que le diff introduit clairement
- **Code de debug laissé par erreur** : `console.log`, `print`, `debugger`, `TODO` ou `FIXME` ajoutés dans ce diff (pas ceux déjà présents)
- **Secrets ou données sensibles** : clés API, mots de passe, tokens hardcodés dans le code ajouté
- **Imports inutilisés** ajoutés par ce diff
- **Fonctions ou variables déclarées mais jamais appelées** introduites par ce diff
- **Incohérences de style flagrantes** : indentation mixte tabs/espaces, nommage radicalement différent du reste du fichier

**Ce qu'il ne faut PAS bloquer** :

- Problèmes existants dans le code non touché par ce diff
- Préférences de style subjectives (longueur de ligne, ordre des imports)
- Refactoring opportuniste hors scope du changement

**Pour chaque problème bloquant trouvé :**

1. Corriger directement le fichier concerné
2. Re-stager le fichier corrigé (`git add <fichier>`)
3. Mentionner brièvement la correction faite (une ligne par correction)

Si aucun problème bloquant n'est trouvé, continuer sans commentaire — ne pas produire de rapport vide.

### Étape 3 — Message de commit

1. Analyser les changements après corrections : feature, fix, refactor ou chore ?
2. Générer un message au format conventionnel :
   - `feat:` — nouvelle fonctionnalité
   - `fix:` — correction de bug
   - `refactor:` — refactoring sans changement fonctionnel
   - `chore:` — maintenance (dépendances, config, CI)
3. Message en français, une ligne, 72 caractères maximum
4. Proposer le message et attendre la validation de l'utilisateur

### Étape 4 — Commit

Une fois le message validé : `git commit -m "<message>"`

## Exemples de corrections automatiques

**Console.log de debug :**
```
# Diff introduit : +console.log('debug auth', user)
→ Suppression de la ligne, re-staging, message : "Supprimé console.log de debug dans auth.js"
```

**Import inutilisé :**
```
# Diff introduit : +import { unused } from './utils'
→ Suppression de l'import, re-staging, message : "Supprimé import inutilisé 'unused' dans component.js"
```

**Clé API hardcodée :**
```
# Diff introduit : +const API_KEY = "sk-1234abcd..."
→ Remplacement par une variable d'environnement, re-staging, message : "Remplacé clé API hardcodée par process.env.API_KEY"
```
