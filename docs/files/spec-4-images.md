# Import PrestaShop – Spec 4/4 : Images (ZIP)

## Périmètre
Ce document couvre le traitement de l'**archive ZIP** contenant les images produits.  
Il associe chaque image à son produit via la référence encodée dans le nom de fichier.

---

## Prérequis

Ce module **dépend** du module 1 (Produits). La map suivante doit être disponible :

```ts
productMap: Map<string, { id_product: number; ... }>
// clé = reference produit ex: "T_01"
```

Ce module est **optionnel** : si aucun fichier ZIP n'est fourni, l'import se termine après le module 3.

---

## Structure du fichier attendu

- Format : archive **ZIP**
- Contenu : fichiers image nommés `{reference}.jpg` ou `{reference}.png`
- Exemples : `T_01.png`, `C_03.jpg`, `P_01.png`
- Champ de téléversement : `file_images`
- Formats image acceptés : `image/jpeg`, `image/png`

> La référence dans le nom de fichier doit correspondre **exactement** à une `reference` du fichier produits (ex: `T_01`, pas `t_01`).

---

## Phase séquentielle

### Phase 0 – Décompression et inventaire
1. Lire le fichier ZIP en mémoire (via `JSZip` ou équivalent).
2. Lister tous les fichiers de l'archive.
3. Filtrer : ne garder que les fichiers `.jpg` / `.jpeg` / `.png` à la racine de l'archive.
4. Pour chaque fichier, extraire la référence : `nom_fichier.split('.')[0]` → ex: `"T_01"`.
5. Vérifier que la référence est présente dans `productMap` (warning si absente, pas d'erreur bloquante).

### Phase 9 – Upload des images

Pour chaque fichier image valide :

1. Récupérer `id_product` depuis `productMap[reference]`
2. Lire le contenu du fichier en `Blob` ou `ArrayBuffer`
3. Construire un `FormData` :
```js
const formData = new FormData();
formData.append('image', blob, `${reference}.jpg`); // ou .png
```
4. `POST /api/images/products/{id_product}` avec `Content-Type: multipart/form-data`
5. Vérifier la réponse HTTP (201 = succès)
6. Logger : `✓ Image uploadée pour ${reference} (id_product: ${id_product})`

> **Note PrestaShop** : l'API images utilise `multipart/form-data`, contrairement aux autres endpoints qui utilisent XML. Ne pas envoyer de body XML ici.

#### Exemple de requête fetch
```js
const response = await fetch(
  `${PS_BASE_URL}/api/images/products/${id_product}`,
  {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(apiKey + ':'),
      // Ne pas setter Content-Type manuellement avec FormData
    },
    body: formData,
  }
);
```

---

## Comportement selon la version PrestaShop

| Version | Endpoint image          | Remarque                                      |
|---------|-------------------------|-----------------------------------------------|
| 1.7.x   | `/api/images/products/{id_product}` | Standard                          |
| 8.x     | `/api/images/products/{id_product}` | Identique, vérifié                |

Si la boutique a plusieurs images par produit, chaque POST ajoute une image supplémentaire. Le premier upload devient automatiquement l'image principale (`cover`).

---

## Conversions de données

| Source                  | Transformation                          |
|-------------------------|-----------------------------------------|
| `T_01.png` (nom fichier)| `split('.')[0]` → `"T_01"` (référence)  |
| Contenu fichier         | `ArrayBuffer` → `Blob` → `FormData`     |

---

## Gestion des erreurs

| Type                 | Cause                                          | Comportement         |
|----------------------|------------------------------------------------|----------------------|
| `VALIDATION_ERROR`   | Fichier non image (ni jpg/png)                 | Ignoré silencieusement |
| `MISSING_DEPENDENCY` | Référence absente de `productMap`              | Log warning + skip   |
| `API_ERROR`          | HTTP 4xx/5xx sur POST image                    | Log + skip le fichier |
| `FORMAT_ERROR`       | ZIP corrompu ou illisible                      | Erreur bloquante, module annulé |

---

## Librairie recommandée

```bash
npm install jszip
```

```js
import JSZip from 'jszip';

const zip = await JSZip.loadAsync(file); // file = File object du input
zip.forEach(async (relativePath, zipEntry) => {
  if (zipEntry.dir) return;
  const blob = await zipEntry.async('blob');
  // traiter blob...
});
```

---

## Endpoints utilisés

```
POST /api/images/products/{id_product}   (multipart/form-data)
```

---

## Output de ce module

- Images produits visibles dans le back-office PrestaShop
- Première image uploadée = image de couverture automatique

> Ce module est le dernier de la chaîne. Aucune map n'est produite.

---

## Récapitulatif des dépendances inter-modules

```
Module 1 (Produits)
  └── produit taxRateMap, categoryMap, productMap
        │
        ├── Module 2 (Déclinaisons & Stocks)  [consomme productMap]
        │     └── produit attributeMap, attributeValueMap, combinationMap
        │           │
        │           └── Module 3 (Commandes)  [consomme productMap + combinationMap]
        │
        └── Module 4 (Images)  [consomme productMap]
```
