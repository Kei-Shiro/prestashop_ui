# Architecture — prestashop_ui

**Date** : 2026-05-07  
**Stack** : Vue 3 + TypeScript + Vite  
**Principe** : Aller au plus simple qui fonctionne, sans sur-ingénierie

---

## Arborescence

```
src/
├── api/
│   └── client.ts          # Instance Axios (fusion de api.js actuel)
├── services/
│   ├── api-service.ts     # Wrapper GET/POST/PUT/DELETE → XML
│   ├── import-service.ts  # Dispatcher CSV / Excel / Sheets
│   ├── reset-service.ts   # Reset données PrestaShop
│   └── import_type/
│       ├── csv-import.ts
│       ├── excel-import.ts
│       └── sheet-import.ts
├── utils/
│   └── xml-parser.ts      # parseXml + xmlToJson
├── types/
│   └── index.ts           # Interfaces partagées (Product, etc.)
├── components/            # Composants UI réutilisables
│   └── ProductTable.vue
├── pages/                 # Une page = une vue principale
│   ├── ProductsPage.vue
│   └── ImportPage.vue
├── App.vue
└── main.ts
```

**Pas de :**
- Pinia (aucun état global partagé pour l'instant)
- Vue Router (si une seule page active, inutile)
- Composables (la logique tient dans les pages, pas besoin d'une couche de plus)

Ajouter uniquement quand le besoin est réel, pas par anticipation.

---

## Ce qui change par rapport à l'état actuel

### 1. Fusionner `api.js` + `api-service.ts` → deux fichiers distincts mais propres

`api/client.ts` — configuration réseau uniquement :

```typescript
// src/api/client.ts
import axios from 'axios'

const client = axios.create({
    baseURL: '/api',
    timeout: 10000,
    headers: { 'Content-Type': 'application/xml' },
    auth: {
        username: import.meta.env.VITE_PS_API_KEY,
        password: ''
    },
})

client.interceptors.response.use(
    (r) => r,
    (err) => {
        // TODO : créer une route /login ou gérer le 401 dans l'UI
        // window.location.href = '/login' ← route inexistante, à ne pas activer
        console.error('Erreur API', err.response?.status)
        return Promise.reject(err)
    }
)

export default client
```

`services/api-service.ts` — wrapper métier, inchangé (déjà bien fait) :

```typescript
// src/services/api-service.ts
import client from '../api/client'
import { parseXml, xmlToJson } from '../utils/xml-parser'
import type { AxiosRequestConfig } from 'axios'

const apiService = {
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await client.get(url, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },
    async post<T>(url: string, data?: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await client.post(url, data, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },
    async put<T>(url: string, data?: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await client.put(url, data, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const r = await client.delete(url, { ...config, responseType: 'text' })
        return xmlToJson(parseXml(r.data)) as T
    },
}

export default apiService
```

---

### 2. Déplacer la logique de `TestGet.vue` dans une Page

Le composant actuel mélange logique métier et template. On sépare :

`components/ProductTable.vue` — affichage pur :

```vue
<!-- src/components/ProductTable.vue -->
<script setup lang="ts">
import type { Product } from '../types'
defineProps<{ products: Product[] }>()
</script>

<template>
  <table>
    <thead>
      <tr><th>Id</th><th>Nom</th><th>Prix</th></tr>
    </thead>
    <tbody>
      <tr v-for="p in products" :key="p.id_product">
        <td>{{ p.id_product }}</td>
        <td>{{ p.name }}</td>
        <td>{{ p.price }}</td>
      </tr>
    </tbody>
  </table>
</template>
```

`pages/ProductsPage.vue` — logique + orchestration :

```vue
<!-- src/pages/ProductsPage.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apiService from '../services/api-service'
import ProductTable from '../components/ProductTable.vue'
import type { Product } from '../types'

const products = ref<Product[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res: any = await apiService.get('/products?display=[id,name,price]')
    let list = res?.prestashop?.products?.product ?? []
    if (!Array.isArray(list)) list = [list]

    products.value = list.map((p: any) => ({
      id_product: Number(p.id),
      name: p.name?.language ?? p.name ?? '',
      price: p.price,
    }))
  } catch {
    error.value = 'Erreur de chargement'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <p v-if="loading">Chargement...</p>
    <p v-else-if="error">{{ error }}</p>
    <ProductTable v-else :products="products" />
  </div>
</template>
```

---

### 3. Corriger `reset-service.ts` (bugs critiques)

```typescript
// src/services/reset-service.ts
import apiService from './api-service'

const resetService = {
    async resetAll(): Promise<void> {
        // Remplacer '' par les vrais endpoints PrestaShop
        await apiService.delete('/products')
        await apiService.delete('/customers')
        // Ajouter d'autres ressources si nécessaire
    },
}

export default resetService
```

**Problèmes corrigés :**
- Endpoint `''` remplacé par les vraies routes
- Double appel identique supprimé
- Feedback à gérer côté appelant (try/catch dans le composant)

---

### 4. Types partagés

```typescript
// src/types/index.ts
export interface Product {
    id_product: number
    name: string
    price: string | number
}
```

Ajouter les autres interfaces ici au fur et à mesure (`Customer`, `Order`, etc.).

---

## Bugs à corriger en priorité

| # | Fichier | Problème | Correction |
|---|---------|----------|------------|
| 1 | `client.ts` | Redirection vers `/login` inexistante | Gérer le 401 dans l'UI ou créer la route |
| 2 | `reset-service.ts` | Endpoints vides `''` | Mettre les vrais endpoints |
| 3 | `reset-service.ts` | Double DELETE identique | Supprimer le doublon |
| 4 | `import-service.ts` | Données envoyées en JSON, API attend du XML | Sérialiser en XML avant POST |
| 5 | `sheet-import.ts` | Fetch sans timeout | Ajouter `AbortController` avec 30s |

---

## Quand ajouter des couches supplémentaires ?

| Besoin | Solution à ajouter |
|--------|--------------------|
| État partagé entre plusieurs pages | Pinia |
| Navigation multi-pages | Vue Router |
| Logique réactive réutilisée dans 2+ composants | Composable `useXxx.ts` |
| Tests unitaires | Vitest |

Ne pas les ajouter avant d'en avoir réellement besoin.

---

## Ce qui est déjà bien et ne change pas

- `xml-parser.ts` — propre, rien à modifier
- `import-service.ts` — dispatcher bien structuré
- `vite.config.js` — proxy correctement configuré
- `api-service.ts` — abstraction utile, à garder telle quelle