# Architecture Vue 3 : Composition, Composables et Pinia

## Théorie

PrestaShop UI est construit autour de la **Composition API**. Fini les gros objets `export default { data, methods, computed }`.
L'architecture favorise la séparation des responsabilités via l'approche "Feature-based" :
- **Composables (`useFeature.ts`)** : Logique réutilisable liée aux composants Vue (cycle de vie, réactivité).
- **Stores (Pinia)** : État global de l'application (ex: Panier, Utilisateur connecté).
- **Services** : Appels API purs (Axios), sans état.

## Exemples du projet

### 1. Un Composable typique (`useCart.ts`)
```typescript
import { ref, computed } from 'vue';
import { useCartStore } from '../stores/cartStore';

export function useCart() {
  const store = useCartStore();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const addToCart = async (productId: string, qty: number) => {
    isLoading.value = true;
    error.value = null;
    try {
      await store.addProduct(productId, qty);
    } catch (err: any) {
      error.value = err.message || 'Erreur lors de l\'ajout';
    } finally {
      isLoading.value = false;
    }
  };

  return {
    cart: computed(() => store.cart),
    total: computed(() => store.total),
    isLoading,
    error,
    addToCart
  };
}
```

## Pinia vs Composables
Pourquoi utiliser Pinia s'il y a des composables ?
- **Pinia** : Pour la donnée qui doit survivre à la destruction du composant et être partagée entre plusieurs pages (ex: Le panier, l'utilisateur).
- **Composables** : Pour la logique locale ou pour orchestrer les stores et les services métier, et gérer l'état UI (`isLoading`, `error`).

## Exercice Pratique : Refactoriser un composant Options API en Composition API

**Objectif** : Transformer ce pseudo-code Options API en Composition API avec `<script setup>`.

```javascript
// A transformer !
export default {
  data() {
    return {
      searchQuery: '',
      products: []
    }
  },
  computed: {
    filteredProducts() {
      return this.products.filter(p => p.name.includes(this.searchQuery));
    }
  },
  methods: {
    async fetchProducts() {
      this.products = await api.get('/products');
    }
  },
  mounted() {
    this.fetchProducts();
  }
}
```

### Solution

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// Imaginer que l'api est importée d'un service
import { productService } from '@/features/catalog/services/product-service';
import type { Product } from '@/shared/types/product';

const searchQuery = ref('');
const products = ref<Product[]>([]);

// computed prend une fonction de callback
const filteredProducts = computed(() => {
  return products.value.filter(p => 
    p.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const fetchProducts = async () => {
  try {
    products.value = await productService.getAll();
  } catch (error) {
    console.error("Erreur de récupération des produits", error);
  }
};

onMounted(() => {
  fetchProducts();
});
</script>
```

## Astuces Senior 💡
- **Destructuration et Réactivité** : Ne destructurez jamais un store Pinia ou un objet réactif directement (`const { total } = useCartStore()`). Utilisez `storeToRefs(useCartStore())` ou enveloppez dans une `computed` pour garder la réactivité.
- **Provide/Inject** : Utilisez-les pour éviter le "Prop Drilling" (passer des props à travers 5 niveaux de composants) lorsqu'un contexte local (ex: un formulaire complexe) a besoin d'être partagé entre ses enfants, sans pour autant polluer le store global Pinia.
