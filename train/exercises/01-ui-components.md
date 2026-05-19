# Exercices Pratiques - Niveau 1 (Basiques)

Cet exercice vous permettra de valider votre compréhension des bases de Vue 3 et de l'intégration API dans le projet.

## Challenge 1 : Composant "Pastille de Statut de Commande"

Dans le Back-office, on souhaite afficher une pastille de couleur différente selon l'état de la commande (ex: Livré = Vert, Annulé = Rouge, En cours = Orange).

**Consignes :**
1. Créer un composant `OrderStatusBadge.vue` dans `@shared/ui/components/`.
2. Il accepte une prop `status` de type `string`.
3. Utiliser une `computed` pour déterminer la classe CSS (couleur) en fonction du texte.
4. L'affichage doit être une pastille arrondie (`border-radius`, `padding`).

<details>
<summary><b>Voir la solution détaillée</b></summary>

```vue
<!-- src/shared/ui/components/OrderStatusBadge.vue -->
<template>
  <span :class="['status-badge', badgeClass]">
    {{ status }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  status: string;
}>();

const badgeClass = computed(() => {
  const normalizedStatus = props.status.toLowerCase();
  
  if (normalizedStatus.includes('livré') || normalizedStatus.includes('delivered')) {
    return 'badge-success';
  }
  if (normalizedStatus.includes('annulé') || normalizedStatus.includes('canceled') || normalizedStatus.includes('erreur')) {
    return 'badge-danger';
  }
  if (normalizedStatus.includes('en cours') || normalizedStatus.includes('attente') || normalizedStatus.includes('pending')) {
    return 'badge-warning';
  }
  
  return 'badge-default'; // Fallback
});
</script>

<style scoped>
.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
}
.badge-success { background-color: #d4edda; color: #155724; }
.badge-danger { background-color: #f8d7da; color: #721c24; }
.badge-warning { background-color: #fff3cd; color: #856404; }
.badge-default { background-color: #e2e3e5; color: #383d41; }
</style>
```
</details>

---

## Challenge 2 : Consommer un endpoint API (Catégories)

**Consignes :**
1. Créer un service `categoryService.ts`
2. Appeler `apiService.get('/categories?display=full')`.
3. Retourner un tableau formaté de catégories en extrayant correctement l'ID et le Nom (rappel: multilingue !).

<details>
<summary><b>Voir la solution détaillée</b></summary>

```typescript
// src/features/catalog/services/category-service.ts
import { apiService } from '@/shared/api/api-service';
import { extractIdValue } from '@/shared/utils/extractIdValue';
import { extractLanguageValue } from '@/shared/utils/extractLanguageValue';
import { ensureArray } from '@/shared/utils/arrayUtils';

export interface Category {
  id: string;
  name: string;
  active: boolean;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiService.get('/categories?display=full');
      const rawCategories = ensureArray(response.prestashop?.categories?.category);
      
      return rawCategories.map(cat => ({
        id: extractIdValue(cat.id),
        name: extractLanguageValue(cat.name),
        active: String(cat.active) === '1'
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories', error);
      throw error;
    }
  }
};
```
</details>
