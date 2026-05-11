# Design — Composants Import et Reset

## Objectif
Créer deux composants Vue simples (Import, Reset) avec une UI minimale, une liste d’endpoint pour l’import, et un feedback basique (chargement, succès, erreur). Le tout sans sur‑ingénierie.

## Architecture
- `src/components/Import.vue` : UI + logique d’import (fichier ou Google Sheet).
- `src/components/Reset.vue` : UI + logique de reset des ressources PrestaShop.
- `src/App.vue` : affiche `ProductPage`, `Import` et `Reset` dans des sections simples.

## Composants & flux

### Import.vue
- **Entrées** :
  - Sélection de fichier (CSV/XLSX/XLS).
  - Champ URL Google Sheet (optionnel).
  - Liste d’endpoint avec valeur par défaut (ex. `/products`).
- **Action** : bouton “Importer”.
  - Si un fichier est choisi → `importService.importFile(file, endpoint)`.
  - Sinon, si URL renseignée → `importService.importGoogleSheet(url, endpoint)`.
- **Feedback** :
  - `loading` pour désactiver le bouton.
  - `message` en cas de succès.
  - `error` en cas d’échec.
- **Validation** : refuser l’action si aucun fichier et aucune URL ne sont fournis.

### Reset.vue
- **Action** : bouton “Reset”.
  - Appelle `resetService.resetAll()`.
- **Feedback** :
  - `loading` pour désactiver le bouton.
  - `message` en cas de succès.
  - `error` en cas d’échec.

## Erreurs & messages
- Messages simples, en français.
- Pas de retry automatique.
- Gestion d’erreur au niveau composant via try/catch.

## Tests
- Aucun test ajouté (scope minimal demandé).

## Notes sur les commentaires
- Ajouter des commentaires courts uniquement pour les actions clés, afin d’éviter le bruit.
