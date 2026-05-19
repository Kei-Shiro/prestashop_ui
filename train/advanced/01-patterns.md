# Architecture Avancée et Performance

Ce document s'adresse aux développeurs cherchant à optimiser le projet PrestaShop UI et à utiliser des design patterns avancés dans Vue 3.

## 1. Pattern : "Repository & API Client Découplés"

Dans le dossier `shared/api/`, le client Axios (`api-service.ts`) est centralisé.
Ne jamais faire d'appel Axios directement dans un composant Vue.

**Avantages :**
- Gestion globale des erreurs (ex: intercepteur Axios qui catch les 401 et redirige vers le login).
- Serializer centralisé (le XML est géré en un seul endroit).

## 2. Performances : Lazy Loading et Chunking

L'application Front-office et Back-office peut devenir lourde.
Utilisez le Lazy Loading du Vue Router pour découper le build.

```typescript
// Mauvais : Tout est chargé au premier accès
import StatsPage from '../pages/StatsPage.vue';

// Bon : Chargement à la demande (Vite crée un chunk séparé)
const StatsPage = () => import('../pages/StatsPage.vue');

const routes = [
  { path: '/stats', component: StatsPage }
];
```

## 3. Injection de Dépendances (Provide / Inject)

Plutôt que d'utiliser Pinia pour des états éphémères ou très localisés (ex: Un tunnel d'importation en 4 étapes dans le Back-office), utilisez `Provide/Inject`.

**Parent (`ImportWizard.vue`) :**
```vue
<script setup>
import { provide, ref } from 'vue';

const importState = ref({ step: 1, file: null, mappings: {} });
const nextStep = () => importState.value.step++;

// On fournit un objet global accessible uniquement aux enfants
provide('importContext', { importState, nextStep });
</script>
```

**Enfant (`StepTwo.vue`) :**
```vue
<script setup>
import { inject } from 'vue';

// On récupère le contexte. Le 2eme paramètre est la valeur par défaut.
const { importState, nextStep } = inject('importContext', null);
</script>
```

## 4. Debounce des recherches API

Sur le front-office, lorsque l'utilisateur tape dans la barre de recherche, nous ne voulons pas flooder l'API PrestaShop à chaque frappe de touche.

**Créer un utilitaire `useDebounce` ou utiliser lodash :**
```typescript
// Un debounce fait maison simple :
export function debounce(fn: Function, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}
```

**Utilisation dans Vue :**
```typescript
const executeSearch = debounce(async (query: string) => {
  results.value = await apiService.get(`/products?filter[name]=%[${query}]%`);
}, 300);

watch(searchQuery, (newVal) => executeSearch(newVal));
```

## 5. Gestion des requêtes concurrentes (Race Conditions)

Si l'utilisateur clique frénétiquement sur des filtres, l'API peut renvoyer la requête la plus lente *après* la requête la plus rapide, affichant les mauvais résultats.
Utilisez l'`AbortController` natif du web.

```typescript
// Dans le service API
let currentAbortController: AbortController | null = null;

async function fetchProductsFiltered(filters) {
  // Annuler la requête précédente si elle est encore en cours
  if (currentAbortController) {
    currentAbortController.abort();
  }
  currentAbortController = new AbortController();

  try {
    const res = await axios.get('/products', {
      params: filters,
      signal: currentAbortController.signal
    });
    return res.data;
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log("Requête annulée");
    } else {
      throw err;
    }
  }
}
```

## Challenge Avancé : Optimistic UI
L'"Optimistic UI" consiste à mettre à jour l'interface utilisateur *avant* que le serveur n'ait répondu, pour donner une impression de vitesse instantanée.

**Exercice :** Implémentez l'Optimistic UI lors de l'ajout au panier.
1. Au clic, ajoutez visuellement l'item au panier local (`cartStore.addLocal(item)`).
2. Lancez l'appel API.
3. Si l'API échoue (`catch`), "Rollback" le panier local (retirez l'item) et affichez une erreur.
