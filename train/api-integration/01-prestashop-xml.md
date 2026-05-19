# Intégration API PrestaShop & XML

## Théorie : Le cauchemar du XML rendu facile

PrestaShop expose son API WebService exclusivement en XML. Dans une application JS moderne, manipuler du XML est complexe.
Notre projet utilise :
1. **`fast-xml-parser`** : Convertit le XML en objets JS et inversement.
2. **`apiService.ts`** : Un wrapper Axios qui s'occupe de la sérialisation automatiquement.

### Spécificités de l'API PrestaShop
- **Root Tag** : Toute requête envoyée doit être encapsulée dans une balise `<prestashop>`.
- **`xmlns:xlink`** : Les objets retournés ont souvent des ID cachés dans les attributs, ex: `<id_default_image xlink:href="...api/images/products/1/2">2</id_default_image>`.
- **Multilingue** : Les champs textes sont souvent des objets si la boutique est multilingue: 
  `<name><language id="1">T-shirt</language></name>`.

## Les Utilitaires indispensables (Cheatsheet)
Pour lire ces données proprement en JS, utilisez TOUJOURS nos utilitaires de `@shared/utils/` :

```typescript
import { extractIdValue } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

// ID simple ou avec attributs :
const productId = extractIdValue(rawProduct.id_default_image);

// Nom (gère le multilingue ou la string directe) :
const productName = extractLanguageValue(rawProduct.name);
```

## Exercice Pratique : Création d'un Service de Mise à jour de Stock

**Contexte** : Dans PrestaShop, la mise à jour des stocks se fait via la ressource `stock_availables`.
**Objectif** : Écrire une fonction `updateStock` qui prend un `id_stock_available` et une `quantity`, et envoie le bon payload XML.

### Solution

```typescript
// src/features/inventory/services/stock-service.ts
import { apiService } from '@/shared/api/api-service';

export const stockService = {
  
  async updateStock(id_stock_available: string, newQuantity: number): Promise<void> {
    // 1. Récupérer l'état actuel du stock (Obligatoire pour PrestaShop, il faut l'id_product et id_product_attribute)
    const response = await apiService.get(`/stock_availables/${id_stock_available}`);
    const currentStock = response.prestashop.stock_available;

    // 2. Construire le Payload JS
    const payload = {
      stock_available: {
        id: currentStock.id,
        id_product: extractIdValue(currentStock.id_product),
        id_product_attribute: extractIdValue(currentStock.id_product_attribute),
        id_shop: extractIdValue(currentStock.id_shop),
        id_shop_group: extractIdValue(currentStock.id_shop_group),
        quantity: newQuantity,
        depends_on_stock: currentStock.depends_on_stock,
        out_of_stock: currentStock.out_of_stock
      }
    };

    // 3. Envoyer la requête PUT (apiService va transformer le JS en XML et ajouter <prestashop>)
    await apiService.put(`/stock_availables/${id_stock_available}`, payload);
  }
};
```

## Erreurs Fréquentes et Debugging (Code 400/500)
- **Erreur 400 (Bad Request)** : Vous avez oublié un champ obligatoire requis par PrestaShop. (Lisez toujours le message d'erreur renvoyé dans la réponse API).
- **Le payload n'a pas `<prestashop>`** : Assurez-vous d'utiliser `apiService` et non `axios` directement.
- **Erreur de Parsing JS** : Vous essayez de lire `product.name.toLowerCase()` alors que `product.name` est un objet (multilingue). **Utilisez `extractLanguageValue` !**

## Astuces Senior 💡
- **Filtres de recherche API** : PrestaShop supporte des filtres via l'URL. Exemple : `/api/products?display=full&filter[active]=[1]`. Pensez à utiliser `URLSearchParams` dans Axios plutôt que de concaténer des chaînes manuellement.
- **Optimisation** : Pour les listes (ex: afficher 50 commandes), utilisez `display=[id,reference,total_paid]` plutôt que `display=full` pour réduire drastiquement la taille du XML téléchargé.
