# Guide des Utilitaires du Domaine (DDD) — Documentation du Refactoring

Ce document sert de guide de référence pour comprendre le rôle, la responsabilité et l'impact de chaque utilitaire métier (*Domain Helper*) introduit lors du refactoring architectural orienté **Domain-Driven Design (DDD)**. 

L'objectif de ces utilitaires est de centraliser les règles de gestion complexes, de garantir le principe **DRY (Don't Repeat Yourself)** et de fournir des composants prêts à l'emploi ("comme des Legos") pour accélérer l'implémentation des futures fonctionnalités.

---

## 1. DomainPriceService (`priceUtils.ts`)
**Chemin :** `src/shared/utils/priceUtils.ts`

### 🎯 Rôle principal
Centraliser l'ensemble des règles de calcul financières, de conversion de prix et d'application des taxes de l'application. Il garantit qu'un prix calculé sur la page détail d'un produit est rigoureusement identique à celui généré lors d'un import de fichier CSV ou lors de la validation d'une commande.

### ⚙️ Fonctions clés
* **`calculateTTC(priceHT, taxRatePercent): number`**
    * *Description :* Convertit un prix Hors Taxes (HT) en prix Toutes Taxes Comprises (TTC) sur la base d'un taux de taxe en pourcentage.
    * *Usage :* Utilisé pour la cartographie (*mapping*) des données de l'API brute PrestaShop vers l'affichage Front-office (`productService`), ainsi que pour évaluer l'impact des déclinaisons sur les prix unitaires.
* **`calculateHT(priceTTC, taxRatePercent): number`**
    * *Description :* Opère la conversion inverse (TTC vers HT).
    * *Usage :* Crucial pour les flux d'importation (ex: `productImportService` et `orderImportService`) où les fichiers CSV fournissent souvent des prix TTC alors que le cœur de PrestaShop exige des valeurs HT.
* **`calculateCombinationImpactHT(combinationTTC, productTTC, taxRatePercent): number`**
    * *Description :* Détermine la différence nette en HT générée par une déclinaison de produit (ex: un supplément pour une taille XL) à partir de valeurs TTC en entrée.
    * *Usage :* Utilisé spécifiquement dans les pipelines d'importation de combinaisons (`combinationImportService`).

### 💎 Valeur Métier
Évite les écarts d'arrondis décimaux (le piège classique du `0.1 + 0.2` en JavaScript) entre le catalogue, le panier et la base de données de PrestaShop en encapsulant la précision mathématique requise pour les transactions financières.

---

## 2. DomainCartHelper (`cartUtils.ts`)
**Chemin :** `src/shared/utils/cartUtils.ts`

### 🎯 Rôle principal
Prendre en charge la logique d'agrégation, de regroupement et de consolidation des structures de paniers ou de lignes d'articles.

### ⚙️ Fonctions clés
* **`consolidateItems(items): ConsolidatedItem[]`**
    * *Description :* Analyse un tableau de lignes de commande ou de panier potentiellement fragmentées ou doublées, regroupe les articles par identifiant unique (combinaison Produit + Attribut) et additionne proprement leurs quantités.

### 💎 Valeur Métier
Cette logique évite d'exposer des boucles `for` ou `reduce` complexes au milieu du code métier. Elle standardise la façon dont le système valide les stocks avant un réapprovisionnement (`orderService.checkReorderStock`) ou fusionne les lignes d'articles lors d'un import de masse de commandes historiques (`orderImportService`).

---

## 3. DomainOrderHelper (`orderUtils.ts`)
**Chemin :** `src/shared/utils/orderUtils.ts`

### 🎯 Rôle principal
Piloter la machine à états des commandes. C'est le gardien des règles logiques liées au cycle de vie d'une vente et de son interaction avec les stocks physiques.

### ⚙️ Fonctions clés
* **`triggersStockMovement(orderState): boolean`**
    * *Description :* Détermine si un état de commande donné (ex: "En cours de préparation", "Livré", "Annulé") doit déclencher ou non un mouvement de stock physique dans l'inventaire.
* **`isPending(orderState): boolean`**
    * *Description :* Vérifie si la commande est en attente de validation ou de paiement.

### 💎 Valeur Métier
Dans l'ancienne base de code, les IDs d'états de PrestaShop étaient écrits "en dur" (*hardcoded*) directement dans les composants ou les fonctions de mise à jour (`updateOrderStatus`). Cet utilitaire abstrait ces identifiants techniques au profit de concepts clairs. Si la définition métier de ce qui "déclenche un mouvement de stock" change demain, la modification se fera en un seul et unique endroit.

---

## 4. DomainCatalogHelper (`catalogUtils.ts`)
**Chemin :** `src/shared/utils/catalogUtils.ts`

### 🎯 Rôle principal
Simplifier et normaliser la manipulation des structures de données complexes du catalogue PrestaShop, notamment la gestion hautement imbriquée des attributs, des groupes d'options et des déclinaisons (ex: Tailles, Couleurs).

### ⚙️ Fonctions clés
* **`buildOptionValueNamesMap(combinations): Map<number, string>`**
    * *Description :* Génère un dictionnaire de correspondance rapide permettant d'associer immédiatement un ID d'option à son libellé textuel lisible.
* **`buildCombinationLabel(combination, namesMap): string`**
    * *Description :* Formate proprement et de manière standardisée le nom complet d'une déclinaison (ex: retourne une chaîne propre comme `"M, Blue"` ou `"L, Rouge"`).
* **`extractAttributeGroups(combinations): AttributeGroup[]`**
    * *Description :* Extrait de façon unique les groupes d'options valides à partir d'une liste brute de combinaisons pour générer les sélecteurs de l'interface utilisateur.

### 💎 Valeur Métier
Il supprime toute la complexité algorithmique d'affichage des pages d'inventaire (`StockPage.vue`) et des fiches produits (`ProductDetailPage.vue`). Les composants Vue n'ont plus besoin de faire de doubles boucles complexes ou de restructurer la donnée en ligne ; ils consomment directement des libellés propres et des structures prêtes à être affichées.

---

## 5. Rappel : Utilitaires Techniques de Support (`dateUtils.ts`)
**Chemin :** `src/shared/utils/dateUtils.ts`

Bien que plus technique, cet utilitaire centralise un comportement métier clé :
* **`toPrestashopDate(date): string`** : Convertit un objet Date JavaScript standard en chaîne de caractères au format attendu par la base de données PrestaShop (`YYYY-MM-DD HH:mm:ss`), éliminant les découpages de chaînes manuels et fragiles à base de `.replace('T', ' ').substring(0, 19)`.
* **`formatForDisplay / formatDateTimeForDisplay`** : Standardise l'affichage visuel des dates sur l'ensemble des tableaux de bord et des historiques de commandes.

---

## 🚀 Résumé de la Méthode d'Utilisation pour le Futur

Pour toute nouvelle fonctionnalité (ex: création d'un module de statistiques de ventes, ajout d'un nouveau type d'import ou refonte de l'interface du panier) :
1.  **Ne réécrivez aucun calcul** de taxe ou de prix ➡️ Utilisez `DomainPriceService`.
2.  **Ne manipulez pas manuellement** les listes de produits imbriquées pour l'affichage ➡️ Utilisez `DomainCatalogHelper`.
3.  **Vérifiez toujours** si une action sur une commande impacte le stock via `DomainOrderHelper`.
