# Plan d'Implémentation : Page de Statistiques Financières

## 1. Le Quoi ? (L'Objectif)
L'objectif est de créer une page de "Tableau de Bord" (Dashboard) pour l'administrateur dans votre interface Vue.js (Back-Office). 
Cette page affichera un rapport analytique regroupant, pour **chaque catégorie de produit** :
*   Le montant total des ventes HT (Chiffre d'Affaires).
*   Le montant total d'achat HT (Coût de revient total).
*   Le bénéfice net (Marge).

## 2. Le Pourquoi ? (L'Approche Technique)
L'API REST native de PrestaShop ne fournit pas d'URL "magique" (comme `/api/stats`) qui donne ce résultat directement. 
Nous devons donc utiliser l'approche **Agrégation Côté Client** :
1.  **Récupérer les ventes** : Obtenir toutes les commandes valides et leurs lignes (produits achetés).
2.  **Récupérer les coûts** : Obtenir le catalogue produit pour connaître le `wholesale_price` (prix d'achat) de chaque article vendu.
3.  **Croiser les données** : Faire les mathématiques en JavaScript.

Pour que l'application reste rapide et propre, nous ne devons **pas** mettre tout ce code dans un composant Vue. Nous devons séparer la logique (Service), le stockage temporaire (Store Pinia) et l'affichage (Vue).

---

## 3. Le Comment ? (Workflow et Fichiers)

Nous allons créer un nouveau module fonctionnel appelé `dashboard` dans le dossier `features`.

### Étape 1 : Le Service (La machine à calculer)
**Fichier à créer :** `src/features/dashboard/services/stats-service.ts`

*   **Quoi :** Le fichier qui s'occupe de communiquer avec PrestaShop et de faire les calculs.
*   **Comment :** C'est ici que vous allez **copier-coller le snippet du Chapitre 12.1** de la bibliothèque (`getProfitByCategoryReport`). Le composant UI n'a pas besoin de savoir comment l'API fonctionne, il appellera juste ce service.

### Étape 2 : Le Store Pinia (La mémoire vive)
**Fichier à créer :** `src/features/dashboard/stores/statsStore.ts`

*   **Quoi :** Le cache des données. Le calcul des statistiques prend du temps (plusieurs requêtes API). Si l'administrateur change de page et revient, on ne veut pas refaire les calculs.
*   **Comment :** 
    *   Créer des variables d'état : `isLoading` (pour afficher une icône de chargement) et `statsData` (le résultat du calcul).
    *   Créer une action `loadStatistics()` qui active `isLoading`, appelle `stats-service.ts`, stocke le résultat dans `statsData`, puis désactive `isLoading`.

### Étape 3 : L'Interface Utilisateur (L'affichage)
**Fichiers à créer :** 
1.  `src/features/dashboard/components/StatsTable.vue` (Le tableau visuel réutilisable)
2.  `src/backoffice/views/DashboardPage.vue` (La page principale)

*   **Quoi :** Ce que l'utilisateur verra à l'écran.
*   **Comment :** 
    *   Dans `DashboardPage.vue`, vous importez le store. Au moment du montage (`onMounted`), vous lancez l'action `loadStatistics()`.
    *   Le template affichera un "Chargement en cours..." si `isLoading` est vrai. Sinon, il affichera le composant `<StatsTable :data="statsData" />`.
    *   Le `StatsTable.vue` utilisera un simple `v-for` HTML pour créer les lignes (Catégorie | Ventes | Achats | Bénéfices).

### Étape 4 : Le Routage (L'accès)
**Fichier à modifier :** `src/router/index.ts` (ou le fichier gérant vos routes BO).

*   **Quoi :** Créer l'URL `/admin/dashboard` pour pouvoir accéder à la page.
*   **Comment :** Ajouter un objet route qui pointe vers le composant `DashboardPage.vue` et rajouter un lien vers cette route dans le menu de navigation latéral (Sidebar) de votre Back-office.
