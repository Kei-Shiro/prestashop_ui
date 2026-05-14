# Import PrestaShop – Spec 1/4 : Fichier Produits (CSV)

## Périmètre
Ce document couvre uniquement le traitement du fichier **`produits.csv`**.  
Il inclut les phases préalables (taxes, catégories) nécessaires à la création des produits.

---

## Structure du fichier attendu

| date_availability | produit   | reference | prix_ttc | Taxe  | categorie   | prix_achat |
|-------------------|-----------|-----------|----------|-------|-------------|------------|
| 01/12/2025        | Tshirt    | T_01      | 12,51    | 1,65% | Akanjo      | 8,50       |
| 08/05/2026        | Casquette | C_03      | 5,00     | 0%    | Accessoire  | 2,00       |

- Encodage : UTF-8, séparateur `;`
- Champ obligatoire pour le champ de téléversement : `file_products`

---

## État en mémoire produit de ce module

```ts
taxRateMap:  Map<string, { id_tax_rules_group: number; rate_numeric: number }>
// clé = chaîne brute ex: "1,65%"

categoryMap: Map<string, number>
// clé = libellé catégorie, valeur = id_category

productMap:  Map<string, { id_product: number; prix_ttc: number; id_tax_rules_group: number; rate: number }>
// clé = reference produit ex: "T_01"
```

Ces maps sont exportées et consommées par les modules 2 (déclinaisons), 3 (commandes) et 4 (images).

---

## Phases séquentielles

### Phase 0 – Parsing et validation
1. Lire le CSV, normaliser le séparateur `;`, gérer les guillemets.
2. Vérifier la présence des colonnes : `date_availability`, `produit`, `reference`, `prix_ttc`, `Taxe`, `categorie`, `prix_achat`.
3. Extraire la liste **unique** des valeurs de `Taxe` et de `categorie`.

### Phase 1 – Taxes
Pour chaque valeur unique de `Taxe` (ex: `"1,65%"`, `"0%"`) :

1. Nettoyer : supprimer `%`, remplacer `,` par `.` → `1.65`
2. `POST /api/taxes` → `{ rate: 1.65, active: 1, name: "Taxe 1.65%" }`  
   → récupérer `id_tax`
3. `POST /api/tax_rules_groups` → récupérer `id_tax_rules_group`
4. `POST /api/tax_rules` → lier `id_tax_rules_group` + `id_tax` + `id_country = 1`
5. Cache : `taxRateMap["1,65%"] = { id_tax_rules_group, rate_numeric: 1.65 }`

> **Cas 0%** : créer quand même le groupe pour uniformiser le traitement.

### Phase 2 – Catégories
Pour chaque catégorie unique :

1. `GET /api/categories?filter[name]=[libellé]`  
   → si trouvée, utiliser l'`id_category` existant
2. Sinon `POST /api/categories` → `{ name, active: 1, id_parent: 0 }`  
   → récupérer `id_category`
3. Cache : `categoryMap["Akanjo"] = id_category`

### Phase 3 – Produits
Pour chaque ligne du CSV :

1. Nettoyer `prix_ttc` : `,` → `.`, parser en float
2. Nettoyer `prix_achat` : idem
3. Récupérer `{ id_tax_rules_group, rate_numeric }` depuis `taxRateMap`
4. Calculer `price_ht = prix_ttc / (1 + rate_numeric / 100)` (arrondi 6 décimales)
5. Formater `available_date` : `DD/MM/YYYY` → `YYYY-MM-DD`
6. Récupérer `id_category` depuis `categoryMap`
7. `POST /api/products` avec le payload XML :

```xml
<product>
  <reference>{reference}</reference>
  <name><language id="1">{produit}</language></name>
  <price>{price_ht}</price>
  <wholesale_price>{prix_achat}</wholesale_price>
  <id_tax_rules_group>{id_tax_rules_group}</id_tax_rules_group>
  <available_date>{YYYY-MM-DD}</available_date>
  <active>1</active>
  <associations>
    <categories>
      <category><id>{id_category}</id></category>
    </categories>
  </associations>
</product>
```

8. Récupérer `id_product` depuis la réponse
9. Cache : `productMap["T_01"] = { id_product, prix_ttc, id_tax_rules_group, rate: rate_numeric }`

---

## Conversions de données

| Source CSV     | Transformation              | Exemple              |
|----------------|-----------------------------|----------------------|
| `12,51`        | `,` → `.`, parseFloat       | `12.51`              |
| `1,65%`        | strip `%`, `,` → `.`        | `1.65`               |
| `01/12/2025`   | `DD/MM/YYYY` → `YYYY-MM-DD` | `2025-12-01`         |

---

## Gestion des erreurs

| Type                | Cause                                      | Comportement         |
|---------------------|--------------------------------------------|----------------------|
| `VALIDATION_ERROR`  | Colonne manquante, format date invalide    | Log + skip la ligne  |
| `API_ERROR`         | HTTP 4xx/5xx sur POST produit/taxe/catég.  | Log + skip la ligne  |
| `MISSING_DEPENDENCY`| Taxe absente du cache (ne devrait pas arriver si Phase 1 OK) | Log + skip |

---

## Endpoints utilisés

```
POST /api/taxes
POST /api/tax_rules_groups
POST /api/tax_rules
GET  /api/categories?filter[name]=...
POST /api/categories
POST /api/products
```

---

## Output de ce module

- `taxRateMap` alimentée
- `categoryMap` alimentée
- `productMap` alimentée
- Produits visibles dans le back-office PrestaShop

> **Prérequis pour le module suivant** : `productMap` doit être disponible avant de lancer l'import déclinaisons/stocks.
