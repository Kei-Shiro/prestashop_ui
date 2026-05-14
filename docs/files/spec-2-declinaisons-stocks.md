# Import PrestaShop – Spec 2/4 : Déclinaisons & Stocks (CSV)

## Périmètre
Ce document couvre le traitement du fichier **`stocks.csv`**.  
Il crée les attributs produit, les combinaisons, et met à jour les stocks.

---

## Prérequis

Ce module **dépend** du module 1 (Produits). Les maps suivantes doivent être disponibles :

```ts
productMap:  Map<string, { id_product: number; prix_ttc: number; id_tax_rules_group: number; rate: number }>
```

Les maps produites par ce module sont ensuite consommées par le module 3 (Commandes) :

```ts
attributeMap:      Map<string, number>
// clé = nom spécificité ex: "taille" → id_product_option

attributeValueMap: Map<string, Map<string, number>>
// clé = (spécificité, valeur) → id_product_option_value

combinationMap:    Map<string, number>
// clé = "reference-valeur" ex: "T_01-ngoza" → id_product_attribute
```

---

## Structure du fichier attendu

| reference | spécificité | valeur | stock_initial | prix_vente_ttc |
|-----------|-------------|--------|---------------|----------------|
| T_01      | taille      | ngoza  | 13            | 12,5           |
| T_01      | taille      | kely   | 10            | 15             |
| P_01      | couleur     | mainty | 5             | 23,49          |
| C_03      |             |        | 20            | 5              |

- Encodage : UTF-8, séparateur `;`
- Champ de téléversement : `file_combinations`
- **Ligne sans `spécificité`** (ex: `C_03`) = produit simple sans déclinaison → traité en Phase 6 uniquement (stock direct)

---

## Phases séquentielles

### Phase 0 – Parsing et validation
1. Lire le CSV, normaliser `;`, gérer les guillemets.
2. Vérifier les colonnes : `reference`, `spécificité`, `valeur`, `stock_initial`, `prix_vente_ttc`.
3. Séparer les lignes en deux groupes :
   - **Groupe A** : `spécificité` non vide → déclinaisons
   - **Groupe B** : `spécificité` vide → produits simples (stock uniquement)
4. Extraire les couples uniques `(spécificité, valeur)` depuis le Groupe A.

### Phase 4 – Attributs (product_options)
Pour chaque **spécificité unique** du Groupe A (ex: `taille`, `couleur`) :

1. `POST /api/product_options` :
```xml
<product_option>
  <name><language id="1">{spécificité}</language></name>
  <public_name><language id="1">{spécificité}</language></public_name>
  <group_type>select</group_type>
  <is_color_group>0</is_color_group>
</product_option>
```
2. Récupérer `id_product_option`
3. Cache : `attributeMap["taille"] = id_product_option`

Pour chaque **valeur unique** par spécificité (ex: `ngoza`, `kely`) :

1. `POST /api/product_option_values` :
```xml
<product_option_value>
  <id_attribute_group>{id_product_option}</id_attribute_group>
  <name><language id="1">{valeur}</language></name>
</product_option_value>
```
2. Récupérer `id_product_option_value`
3. Cache : `attributeValueMap["taille"]["ngoza"] = id_product_option_value`

### Phase 5 – Combinaisons
Pour chaque ligne du **Groupe A** :

1. Récupérer depuis `productMap[reference]` :
   - `id_product`, `prix_ttc` (parent), `rate` (taux de taxe)
2. Récupérer `id_product_option_value` depuis `attributeValueMap[spécificité][valeur]`
3. Nettoyer `prix_vente_ttc` : `,` → `.`, parseFloat
4. Calculer l'impact prix HT :
   ```
   impact_ht = (prix_vente_ttc - prix_ttc_parent) / (1 + rate / 100)
   ```
   (peut être négatif si la déclinaison est moins chère que le produit parent)
5. Générer la référence combinaison : `reference + "-" + valeur` (ex: `T_01-ngoza`)
6. `POST /api/combinations` :
```xml
<combination>
  <id_product>{id_product}</id_product>
  <reference>{T_01-ngoza}</reference>
  <price>{impact_ht}</price>
  <associations>
    <product_option_values>
      <product_option_value>
        <id>{id_product_option_value}</id>
      </product_option_value>
    </product_option_values>
  </associations>
</combination>
```
7. Récupérer `id_product_attribute`
8. Cache : `combinationMap["T_01-ngoza"] = id_product_attribute`

### Phase 6 – Mise à jour des stocks

> PrestaShop crée automatiquement une ligne `stock_available` à `quantity=0` pour chaque produit/combinaison. Il faut **toujours faire un PUT**, jamais un POST.

#### Produits simples (Groupe B – `spécificité` vide)

Pour chaque ligne du Groupe B :

1. Récupérer `id_product` depuis `productMap[reference]`
2. `GET /api/stock_availables?filter[id_product]=[id_product]&filter[id_product_attribute]=0`
3. Récupérer l'`id` du premier résultat
4. `PUT /api/stock_availables/{id}` :
```xml
<stock_available>
  <id>{id}</id>
  <id_product>{id_product}</id_product>
  <id_product_attribute>0</id_product_attribute>
  <quantity>{stock_initial}</quantity>
</stock_available>
```

#### Combinaisons (Groupe A)

Pour chaque ligne du Groupe A (après Phase 5) :

1. Récupérer `id_product_attribute` depuis `combinationMap["T_01-ngoza"]`
2. `GET /api/stock_availables?filter[id_product_attribute]=[id_product_attribute]`
3. Récupérer l'`id` du premier résultat
4. `PUT /api/stock_availables/{id}` avec `<quantity>{stock_initial}</quantity>`

---

## Conversions de données

| Source CSV     | Transformation        | Exemple     |
|----------------|-----------------------|-------------|
| `12,5`         | `,` → `.`, parseFloat | `12.5`      |
| `stock_initial`| parseInt              | `13`        |

---

## Gestion des erreurs

| Type                 | Cause                                              | Comportement        |
|----------------------|----------------------------------------------------|---------------------|
| `MISSING_DEPENDENCY` | `reference` absente de `productMap`                | Log + skip la ligne |
| `MISSING_DEPENDENCY` | `(spécificité, valeur)` absent de `attributeValueMap` | Log + skip       |
| `API_ERROR`          | HTTP 4xx/5xx                                       | Log + skip la ligne |
| `VALIDATION_ERROR`   | `prix_vente_ttc` non parseable                     | Log + skip la ligne |

---

## Endpoints utilisés

```
POST /api/product_options
POST /api/product_option_values
POST /api/combinations
GET  /api/stock_availables?filter[id_product]=...&filter[id_product_attribute]=0
GET  /api/stock_availables?filter[id_product_attribute]=...
PUT  /api/stock_availables/{id}
```

---

## Output de ce module

- `attributeMap` alimentée
- `attributeValueMap` alimentée
- `combinationMap` alimentée
- Combinaisons et stocks visibles dans le back-office PrestaShop

> **Prérequis pour le module suivant** : `combinationMap` doit être disponible avant de lancer l'import commandes.
