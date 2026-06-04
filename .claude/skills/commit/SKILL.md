---
name: commit
description: Crée un commit Git avec un message au format conventionnel en français, après analyse du diff et validation
argument-hint: <description courte du changement>
---

## Workflow

1. Lance  pour voir les changements indexés
2. Si rien n'est indexé, lance  et propose les fichiers à indexer
3. Analyse les changements — feature, fix, refactor ou chore ?
4. Génère un message au format conventionnel :
   -  — nouvelle fonctionnalité
   -  — correction de bug
   -  — refactoring sans changement fonctionnel
   -  — maintenance (dépendances, config, CI)
5. Message en français, une ligne, 72 caractères maximum
6. Proposez le message et attendez la validation avant d'exécuter
7. Une fois validé : 

