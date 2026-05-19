# Cheatsheets : Vue 3 & PrestaShop API

Ces fiches de référence rapide sont à garder sous la main.

## 🚀 Vue 3 Composition API

### `ref` vs `reactive`
- `ref` : Pour les types primitifs (string, boolean, number) ET les tableaux remplaçables. Accès via `.value`.
- `reactive` : Pour les objets profonds qu'on ne va pas réassigner intégralement. Pas de `.value`.

```typescript
const isLoading = ref(false); // isLoading.value = true;
const user = reactive({ name: 'Jon', age: 30 }); // user.name = 'Jane';
const products = ref([]); // products.value = [...nouveauTableau];
```

### Cycle de vie
```typescript
import { onMounted, onUnmounted, watch, computed } from 'vue';

onMounted(() => { /* Le DOM est prêt */ });
onUnmounted(() => { /* Nettoyage (timers, event listeners) */ });

// Computed (Lecture seule et mise en cache)
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

// Watch (Observer un changement et lancer une action)
watch(searchQuery, async (newVal, oldVal) => {
  await fetchResults(newVal);
});
```

### Props et Emits (TypeScript)
```vue
<script setup lang="ts">
const props = defineProps<{
  title: string;
  items?: any[]; // Optionnel
}>();

const emit = defineEmits<{
  (e: 'update', id: number): void;
  (e: 'delete'): void;
}>();

// emit('update', 42);
</script>
```

---

## 🛒 API PrestaShop (XML to JS)

### Utilitaires Indispensables
Ils sont dans `@shared/utils/`.

1. **`extractIdValue(val)`**
   L'API renvoie souvent : `{ "#text": "1", "@_xlink:href": "..." }` au lieu de `"1"`.
   ```typescript
   const id = extractIdValue(data.id_default_image); // Renvoie "1" en string
   ```

2. **`extractLanguageValue(val, langId?)`**
   L'API renvoie souvent le multilingue en objet.
   ```typescript
   // name: { language: { "@_id": "1", "#text": "T-Shirt" } }
   const name = extractLanguageValue(product.name); // Renvoie "T-Shirt"
   ```

3. **`ensureArray(data)`**
   Le parser XML casse les tableaux d'un seul élément.
   ```typescript
   const items = ensureArray(response.prestashop.products.product);
   //items est garanti d'être un Array[].
   ```

### URLs et Paramètres Axios utiles
- `display=full` : Récupère tous les champs de l'entité.
- `display=[id,name,price]` : Sélection chirurgicale (très performant).
- `filter[active]=[1]` : Filtrer les résultats (ex: produits actifs uniquement).
- `limit=0,10` : Pagination (de 0, prendre 10 résultats).

```typescript
// Exemple complet
const response = await apiService.get('/products', {
  params: {
    display: '[id,name,price]',
    'filter[active]': '[1]',
    limit: '0,50'
  }
});
```

---

## 📦 Pinia (State Management)

### Définir un Store avec la syntaxe Setup
```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null);
  
  // Getters
  const isAuthenticated = computed(() => !!token.value);
  
  // Actions
  function login(newToken: string) {
    token.value = newToken;
    localStorage.setItem('token', newToken);
  }

  return { token, isAuthenticated, login };
});
```
