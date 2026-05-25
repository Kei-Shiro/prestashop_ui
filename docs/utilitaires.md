# 📦 Guide des Utilitaires du Projet PrestaShop UI

Ce document décrit chaque utilitaire disponible dans le projet, son rôle, ses méthodes, et l'endroit où le trouver.

> Tous les utilitaires sont situés dans le répertoire :
> **`src/shared/utils/`**

---

## Table des matières

| Utilitaire | Fichier | Catégorie |
|---|---|---|
| [DomainPriceService](#1-domainpriceservice) | `priceUtils.ts` | 💰 Métier — Finance |
| [DomainCartHelper](#2-domaincarthelper) | `cartUtils.ts` | 🛒 Métier — Panier |
| [DomainOrderHelper](#3-domainorderhelper) | `orderUtils.ts` | 📦 Métier — Commandes |
| [DomainCatalogHelper](#4-domaincataloghelper) | `catalogUtils.ts` | 🏷️ Métier — Catalogue |
| [extractIdValue / extractIdNumber](#5-extractidvalue--extractidnumber) | `extractIdValue.ts` | 🔧 Technique — XML |
| [extractLanguageValue / toLValue](#6-extractlanguagevalue--tolvalue) | `extractLanguageValue.ts` | 🌐 Technique — Multilingue |
| [ensureArray](#7-ensurearray) | `arrayUtils.ts` | 🔧 Technique — XML |
| [withLoading](#8-withloading) | `asyncUtils.ts` | ⏳ Technique — Async/State |
| [toPrestashopDate / formatForDisplay / formatDateTimeForDisplay](#9-fonctions-de-dates) | `dateUtils.ts` | 📅 Technique — Dates |
| [ImportValidator](#10-importvalidator) | `import-validator.ts` | ✅ Métier — Validation CSV |
| [Serializer](#11-serializer) | `serializer.ts` | 🔧 Technique — XML |
| [Endpoints (erasable / nonErasable)](#12-endpoints) | `endpoints.ts` | 🗂️ Infrastructure — Reset |

---

## Utilitaires Métier (Business Helpers)

### 1. DomainPriceService

> **Fichier** : [`src/shared/utils/priceUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/priceUtils.ts)
> **Catégorie** : Finance / Taxes

Centralise **toutes les formules de calcul de prix** du projet. Évite de disperser les conversions HT ↔ TTC dans les services, les imports CSV et les composants Vue.

| Méthode | Description | Formule |
|---|---|---|
| `calculateTTC(priceHT, taxRate)` | Convertit un prix HT en TTC | `HT × (1 + taux / 100)` |
| `calculateHT(priceTTC, taxRate)` | Convertit un prix TTC en HT | `TTC / (1 + taux / 100)` |
| `calculateCombinationImpactHT(comboTTC, prodTTC, taxRate)` | Calcule l'impact HT d'une déclinaison par rapport au produit de base | `(comboTTC − prodTTC) / (1 + taux / 100)` |

**Utilisé par** : `product.ts`, `order.ts`, `ProductDetailPage.vue`, `productImportService.ts`, `combinationImportService.ts`, `orderImportService.ts`

---

### 2. DomainCartHelper

> **Fichier** : [`src/shared/utils/cartUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/cartUtils.ts)
> **Catégorie** : Panier / Consolidation

Gère la **consolidation des articles de panier**. Quand un même produit + déclinaison apparaît plusieurs fois (ex : réimportation CSV, renouvellement de commande), ce helper les fusionne en additionnant les quantités.

| Méthode | Description |
|---|---|
| `consolidateItems(items)` | Regroupe les articles par `(id_product, id_product_attribute)` et additionne les `quantity` |

**Utilisé par** : `order.ts` (reorder), `orderImportService.ts`

---

### 3. DomainOrderHelper

> **Fichier** : [`src/shared/utils/orderUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/orderUtils.ts)
> **Catégorie** : Commandes / Statuts

Centralise les **constantes d'états de commande PrestaShop** et les règles de transition. Élimine les "magic numbers" dispersés dans le code.

| Constante / Méthode | Description |
|---|---|
| `STATES.AWAITING_PAYMENT` (11) | En attente de paiement |
| `STATES.PAYMENT_ACCEPTED` (2) | Paiement accepté |
| `STATES.PREPARATION` (3) | En préparation |
| `STATES.SHIPPED` (4) | Expédiée |
| `STATES.DELIVERED` (5) | Livrée |
| `STATES.CANCELLED` (6) | Annulée |
| `triggersStockMovement(stateId)` | Retourne `true` si le changement d'état déclenche un mouvement de stock (Livrée ou Annulée) |
| `isPending(stateId)` | Retourne `true` si la commande est en cours de traitement |

**Utilisé par** : `order.ts` (updateOrderStatus)

---

### 4. DomainCatalogHelper

> **Fichier** : [`src/shared/utils/catalogUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/catalogUtils.ts)
> **Catégorie** : Catalogue / Déclinaisons

Centralise la **résolution des attributs de produits** et le **formatage des noms de déclinaisons**. Cette logique était auparavant dupliquée dans 3 endroits différents.

| Méthode | Description |
|---|---|
| `buildOptionValueNamesMap(optionValues)` | Transforme une liste de `product_option_value` brutes en dictionnaire `{ id: nom }` |
| `buildCombinationLabel(combination, namesMap)` | Formate une combinaison en label lisible (ex : `"M, Bleu"`) avec fallback sur la référence ou l'ID |
| `extractAttributeGroups(combinations, allVals, allOpts)` | Génère la structure groupée `{ id, name, values[] }` pour alimenter les sélecteurs `<select>` dans les pages de détail produit |

**Utilisé par** : `stock.ts`, `StockPage.vue`, `ProductDetailPage.vue`

---

## Utilitaires Techniques

### 5. extractIdValue / extractIdNumber

> **Fichier** : [`src/shared/utils/extractIdValue.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/extractIdValue.ts)
> **Catégorie** : Parsing XML PrestaShop

L'API PrestaShop renvoie des IDs sous des formats variés à cause des attributs `xlink` dans le XML :
- Parfois un simple `"42"`
- Parfois un objet `{ "#text": "42", "@_xlink:href": "..." }`
- Parfois `{ "id": 42 }`

| Fonction | Description |
|---|---|
| `extractIdValue(val)` | Extrait un **string** propre quel que soit le format de l'ID |
| `extractIdNumber(val)` | Extrait un **number** propre (avec fallback `0`) |

> ⚠️ **Règle du projet** : Utiliser TOUJOURS `extractIdValue` ou `extractIdNumber` pour lire un identifiant provenant de l'API.

---

### 6. extractLanguageValue / toLValue

> **Fichier** : [`src/shared/utils/extractLanguageValue.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/extractLanguageValue.ts)
> **Catégorie** : Champs multilingues PrestaShop

PrestaShop renvoie les champs texte (nom, description…) sous différents formats selon la configuration de langues :
- Un simple `"Texte"` (mono-langue)
- Un objet `{ language: { "#text": "Texte", "@_id": 1 } }` (multi-langue, une seule langue)
- Un tableau `{ language: [{ "#text": "French" }, { "#text": "English" }] }` (multi-langues)

| Fonction | Description |
|---|---|
| `extractLanguageValue(field)` | Extrait le texte quel que soit le format multilingue |
| `toLValue(text)` | Construit un objet `LangField` pour envoyer une valeur à l'API (écriture) |

> ⚠️ **Règle du projet** : Utiliser TOUJOURS `extractLanguageValue` pour lire un champ multilingue et `toLValue` pour en écrire un.

---

### 7. ensureArray

> **Fichier** : [`src/shared/utils/arrayUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/arrayUtils.ts)
> **Catégorie** : Normalisation XML → Array

Problème classique du parsing XML : quand il y a **1 seul élément**, le parser retourne un objet ; quand il y en a **plusieurs**, il retourne un tableau.

| Fonction | Description |
|---|---|
| `ensureArray(data)` | Retourne toujours un `T[]` : `null/undefined → []`, `T → [T]`, `T[] → T[]` |

---

### 8. withLoading

> **Fichier** : [`src/shared/utils/asyncUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/asyncUtils.ts)
> **Catégorie** : Gestion d'état asynchrone

Évite de répéter le pattern `loading = true; try { ... } catch { ... } finally { loading = false }` dans chaque store Pinia.

| Fonction | Description |
|---|---|
| `withLoading(loadingRef, callback, errorRef?, customMsg?)` | Exécute `callback` en basculant `loadingRef` automatiquement et en capturant les erreurs dans `errorRef` |

**Utilisé par** : Tous les stores Pinia (`useProductStore`, `useStockStore`, `useOrderStore`)

---

### 9. Fonctions de dates

> **Fichier** : [`src/shared/utils/dateUtils.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/dateUtils.ts)
> **Catégorie** : Formatage de dates

| Fonction | Description | Exemple |
|---|---|---|
| `toPrestashopDate(date)` | Convertit une date JS au format API PrestaShop | `"2026-05-25 14:30:00"` |
| `formatForDisplay(dateStr)` | Formate une date PrestaShop pour affichage (FR) | `"25/05/2026"` |
| `formatDateTimeForDisplay(dateStr)` | Formate avec l'heure pour affichage (FR) | `"25/05/2026 à 14:30"` |

**Utilisé par** : `cart.ts`, `combinationImportService.ts`, `StockPage.vue`, `useOrders.ts`, `useCarts.ts`

---

### 10. ImportValidator

> **Fichier** : [`src/shared/utils/import-validator.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/import-validator.ts)
> **Catégorie** : Validation d'imports CSV

Validateur strict pour les fichiers CSV avant importation. Lance des erreurs explicites avec des messages en français.

| Méthode | Description |
|---|---|
| `validateColumns(metaFields, required)` | Vérifie la présence des colonnes requises (insensible à la casse), retourne le mapping colonne → nom réel |
| `validateDateFormat(dateStr, fieldName)` | Valide le format `DD/MM/YYYY` et retourne le format ISO pour PrestaShop |
| `validatePositiveAmount(val, fieldName, allowZero?)` | Vérifie qu'un montant est numérique et positif |

**Utilisé par** : `productImportService.ts`, `combinationImportService.ts`, `orderImportService.ts`

---

### 11. Serializer

> **Fichier** : [`src/shared/utils/serializer.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/serializer.ts)
> **Catégorie** : Conversion XML ↔ JSON

Encapsule `fast-xml-parser` pour la communication avec le WebService PrestaShop.

| Méthode | Description |
|---|---|
| `Serializer.toXml(obj)` | Convertit un objet JS en XML avec la racine `<prestashop>` |
| `Serializer.fromXml(xml)` | Parse du XML PrestaShop en objet JS |

> ℹ️ Utilisé automatiquement par `apiService` — normalement pas appelé directement.

---

### 12. Endpoints

> **Fichier** : [`src/shared/utils/endpoints.ts`](file:///c:/Etude/Projet/Evaluation/prestashop_ui/src/shared/utils/endpoints.ts)
> **Catégorie** : Configuration de reset / données

Référence complète des endpoints PrestaShop, classés par ordre de dépendances FK.

| Export | Description |
|---|---|
| `erasableEndpoints` | Endpoints dont les données peuvent être supprimées en masse (reset) |
| `nonErasableEndpoints` | Endpoints d'infrastructure : **ne jamais supprimer** (PrestaShop crashe sinon) |

**Utilisé par** : `ResetPage.vue`

---

## Arborescence récapitulative

```
src/shared/utils/
├── priceUtils.ts          💰 DomainPriceService (TTC, HT, impact déclinaison)
├── cartUtils.ts           🛒 DomainCartHelper (consolidation panier)
├── orderUtils.ts          📦 DomainOrderHelper (états commande, transitions)
├── catalogUtils.ts        🏷️ DomainCatalogHelper (attributs, déclinaisons)
├── extractIdValue.ts      🔧 extractIdValue / extractIdNumber
├── extractLanguageValue.ts🌐 extractLanguageValue / toLValue
├── arrayUtils.ts          🔧 ensureArray
├── asyncUtils.ts          ⏳ withLoading
├── dateUtils.ts           📅 toPrestashopDate / formatForDisplay
├── import-validator.ts    ✅ ImportValidator (colonnes, dates, montants)
├── serializer.ts          🔧 Serializer (XML ↔ JSON)
├── resource-util.ts       🔧 arrayExceptions (config parser XML)
└── endpoints.ts           🗂️ erasable / nonErasable endpoints
```
