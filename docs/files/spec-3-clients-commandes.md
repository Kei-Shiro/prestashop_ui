# Import PrestaShop – Spec 3/4 : Clients & Commandes (CSV)

## Périmètre
Ce document couvre le traitement du fichier **`commandes.csv`**.  
Il crée les clients, les adresses, les paniers, les commandes et les historiques de statut.

---

## Prérequis

Ce module **dépend** des modules 1 et 2. Les maps suivantes doivent être disponibles :

```ts
productMap:     Map<string, { id_product: number; prix_ttc: number; ... }>
combinationMap: Map<string, number>
// clé = "reference-valeur" ex: "T_01-ngoza" → id_product_attribute
```

Les maps produites par ce module (internes, non réutilisées par d'autres) :

```ts
customerMap: Map<string, number>
// clé = email → id_customer

addressMap:  Map<string, number>
// clé = `${id_customer}::${adresse}` → id_address
```

---

## Structure du fichier attendu

| date       | nom          | email           | pwd      | adresse             | achat                                    | etat              |
|------------|--------------|-----------------|----------|---------------------|------------------------------------------|-------------------|
| 09/05/2026 | Rakotorakoto | r@yopmail.com   | plainpass| Andoharanofotsy     | [("T_01";3;"ngoza")]                     | paiement accepté  |
| 07/05/2026 | Raja         | rj@yopmail.com  | pass123  | Analakely           | [("T_01";2;"kely"),("C_03";1;"")]        |                   |

- Encodage : UTF-8, séparateur `;`
- Champ de téléversement : `file_orders`
- Colonne `etat` optionnelle (peut être vide)
- Colonne `achat` : liste de tuples `("reference";quantité;"valeur")` — `valeur` vide = produit simple

### Format du champ `achat`
```
[("T_01";3;"ngoza"),("C_03";1;"")]
```
Regex de parsing suggéré :
```js
/\("([^"]+)";(\d+);"([^"]*)"\)/g
// groupe 1 = reference, groupe 2 = quantité, groupe 3 = valeur (peut être vide)
```

---

## Phases séquentielles

### Phase 0 – Parsing et validation
1. Lire le CSV, normaliser `;`, gérer les guillemets.
2. Vérifier les colonnes : `date`, `nom`, `email`, `pwd`, `adresse`, `achat`.
3. Pour chaque ligne, parser la colonne `achat` en tableau de tuples `{ ref, qty, valeur }`.
4. Valider que chaque `ref` est présente dans `productMap` (warning si absente, pas d'erreur bloquante).

### Phase 7 – Clients

Pour chaque ligne du CSV (une ligne = une commande, potentiellement même client que ligne précédente) :

#### Création du client (si nouveau)
1. Vérifier `customerMap[email]`
2. Si absent :
   - `POST /api/customers` :
```xml
<customer>
  <lastname>{nom}</lastname>
  <firstname>Client</firstname>
  <email>{email}</email>
  <passwd>{pwd}</passwd>
  <active>1</active>
  <id_lang>1</id_lang>
</customer>
```
   - Récupérer `id_customer`
   - Cache : `customerMap[email] = id_customer`
3. Si présent : réutiliser `id_customer` depuis le cache

> Le mot de passe est envoyé **en clair** — PrestaShop le hache côté serveur automatiquement.

#### Création de l'adresse (si nouvelle)
1. Clé de cache : `${id_customer}::${adresse}`
2. Vérifier `addressMap[clé]`
3. Si absent :
   - `POST /api/addresses` :
```xml
<address>
  <id_customer>{id_customer}</id_customer>
  <id_country>1</id_country>
  <lastname>{nom}</lastname>
  <firstname>Client</firstname>
  <address1>{adresse}</address1>
  <city>{adresse}</city>
  <alias>Adresse principale</alias>
</address>
```
   - Récupérer `id_address`
   - Cache : `addressMap[clé] = id_address`
4. Si présent : réutiliser `id_address` depuis le cache

> `id_address` est utilisé à la fois pour `id_address_delivery` et `id_address_invoice`.

### Phase 8 – Commandes

Pour chaque ligne du CSV :

#### Étape 8.1 – Création du panier
`POST /api/carts` :
```xml
<cart>
  <id_customer>{id_customer}</id_customer>
  <id_address_delivery>{id_address}</id_address_delivery>
  <id_address_invoice>{id_address}</id_address_invoice>
  <id_currency>1</id_currency>
  <id_lang>1</id_lang>
</cart>
```
Récupérer `id_cart`.

#### Étape 8.2 – Ajout des lignes au panier
Pour chaque tuple `{ ref, qty, valeur }` dans `achat` :

1. `id_product` = `productMap[ref].id_product`
2. Si `valeur` non vide : `id_product_attribute` = `combinationMap["${ref}-${valeur}"]`  
   Sinon : `id_product_attribute = 0`
3. Ajouter la ligne au panier via l'association XML du cart, ou `POST /api/cart_rows` :
```xml
<cart_row>
  <id_cart>{id_cart}</id_cart>
  <id_product>{id_product}</id_product>
  <id_product_attribute>{id_product_attribute}</id_product_attribute>
  <quantity>{qty}</quantity>
</cart_row>
```

> **Note** : l'API PrestaShop peut gérer les lignes de panier via l'association `<associations><cart_rows>` dans le PUT du cart, selon la version.

#### Étape 8.3 – Création de la commande
`POST /api/orders` :
```xml
<order>
  <id_customer>{id_customer}</id_customer>
  <id_cart>{id_cart}</id_cart>
  <id_address_delivery>{id_address}</id_address_delivery>
  <id_address_invoice>{id_address}</id_address_invoice>
  <id_currency>1</id_currency>
  <id_lang>1</id_lang>
  <payment>Module inconnu</payment>
  <module>cheque</module>
  <date_add>{YYYY-MM-DD HH:mm:ss}</date_add>
</order>
```
Récupérer `id_order`.

#### Étape 8.4 – Historique de statut (si `etat` renseigné)
1. Si colonne `etat` non vide (ex: `"paiement accepté"`) :
   - Option A (mapping statique) : utiliser une table de correspondance configurée :
     ```ts
     const STATUS_MAP: Record<string, number> = {
       "paiement accepté": 2,
       "en cours de préparation": 3,
       "expédié": 4,
       // ...
     };
     ```
   - Option B (lookup dynamique) : `GET /api/order_states?filter[name]=[etat]`  
     → si trouvé, utiliser `id_order_state`  
     → si non trouvé, `POST /api/order_states` pour le créer
2. `POST /api/order_histories` :
```xml
<order_history>
  <id_order>{id_order}</id_order>
  <id_order_state>{id_order_state}</id_order_state>
  <date_add>{YYYY-MM-DD HH:mm:ss}</date_add>
</order_history>
```

---

## Conversions de données

| Source CSV        | Transformation                        | Exemple                     |
|-------------------|---------------------------------------|-----------------------------|
| `09/05/2026`      | `DD/MM/YYYY` → `YYYY-MM-DD HH:mm:ss` | `2026-05-09 00:00:00`       |
| `achat`           | Parse regex tuples                    | `[{ref:"T_01", qty:3, valeur:"ngoza"}]` |
| `etat`            | Mapping ou lookup API                 | `"paiement accepté"` → `2`  |

---

## Gestion des erreurs

| Type                 | Cause                                               | Comportement        |
|----------------------|-----------------------------------------------------|---------------------|
| `VALIDATION_ERROR`   | Format `achat` non parseable                        | Log + skip la ligne |
| `MISSING_DEPENDENCY` | `ref` absente de `productMap`                       | Log + skip le tuple |
| `MISSING_DEPENDENCY` | `(ref, valeur)` absent de `combinationMap`          | Log + skip le tuple |
| `API_ERROR`          | HTTP 4xx/5xx sur POST customer/cart/order           | Log + skip la ligne |

---

## Endpoints utilisés

```
POST /api/customers
POST /api/addresses
POST /api/carts
POST /api/cart_rows  (ou PUT /api/carts/{id} avec associations)
POST /api/orders
GET  /api/order_states?filter[name]=...
POST /api/order_states  (si création nécessaire)
POST /api/order_histories
```

---

## Output de ce module

- `customerMap` alimentée (interne)
- `addressMap` alimentée (interne)
- Clients, adresses, paniers, commandes et statuts visibles dans le back-office PrestaShop

> Ce module n'expose pas de maps pour les modules suivants. Il est le dernier à utiliser `productMap` et `combinationMap`.
