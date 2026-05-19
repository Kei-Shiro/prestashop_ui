# Typage TypeScript et Generics

## Théorie

L'utilisation de TypeScript dans ce projet est cruciale à cause de la nature de l'API XML. 
PrestaShop renvoie parfois un Objet, parfois un Tableau (s'il y a un seul élément XML, le parser peut le transformer en Objet au lieu d'un tableau d'un seul élément).

### Typer les réponses API
Plutôt que d'utiliser `any`, nous définissons des interfaces dans `@shared/types/`.

```typescript
export interface PrestaShopResponse<T> {
  prestashop: T;
}

// Exemple d'utilisation
interface OrderResource {
  orders: { order: Order | Order[] };
}
```

## Exercice Pratique : Utilitaire `ensureArray`

**Le Problème** : `fast-xml-parser` convertit `<images><image id="1"/></images>` en `images: { image: { id: "1" } }`. 
Mais s'il y a plusieurs images, il convertit en `images: { image: [ { id: "1" }, { id: "2" } ] }`.

**Objectif** : Créer une fonction générique TypeScript `ensureArray<T>(data: T | T[] | undefined): T[]` qui garantit qu'on manipule toujours un tableau.

### Solution

```typescript
// src/shared/utils/arrayUtils.ts

/**
 * Assure que la valeur retournée est toujours un tableau, 
 * utile pour pallier le comportement du parsing XML.
 */
export function ensureArray<T>(data: T | T[] | undefined | null): T[] {
  if (data === undefined || data === null) {
    return [];
  }
  if (Array.isArray(data)) {
    return data;
  }
  // C'est un objet simple, on le wrap dans un tableau
  return [data];
}

// Utilisation typée :
// const images = ensureArray<ProductImage>(product.images?.image);
// images.map(img => img.id); // Typage fort préservé !
```

## Astuces Senior 💡
- **Omit et Pick** : Très utiles pour les formulaires de création (POST). Quand vous créez un produit, vous n'avez pas encore son `id` ou sa `date_add`. 
  Utilisez `type CreateProductDTO = Omit<Product, 'id' | 'date_add'>;`
- **Typage des Emits dans `<script setup>`** :
  ```typescript
  const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
    (e: 'submit', payload: OrderPayload): void;
  }>();
  ```
