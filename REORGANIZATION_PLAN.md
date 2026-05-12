# Plan de Réorganisation - PrestaShop UI

**Projet**: Application Vue 3 PrestaShop (Frontal + Backoffice)  
**Échéance**: 5 jours  
**Objectif**: Code maintenable, componentisé, sans dette technique critique

---

## Résumé Exécutif

Ce plan propose une réorganisation en 5 phases étalées sur 5 jours pour transformer un codebase monolithique en architecture modulaire maintenable.

### Architecture Actuelle
```
src/
├── frontoffice/     (7 pages, 2 composants, 4 stores)
├── backoffice/     (5 pages, 7 composants, 2 stores)
└── shared/
    ├── types/      (8 fichiers - duplications)
    ├── composables/ (5 fichiers)
    ├── services/   (8 services)
    ├── utils/      (3 fichiers)
    └── api/        (client.ts)
```

### Architecture Cible
```
src/
├── apps/
│   ├── frontoffice/
│   └── backoffice/
├── features/
│   ├── auth/        (stores, services, composables, types)
│   ├── products/   (components, services, composables)
│   ├── cart/       (stores, components)
│   ├── orders/     (composables, services)
│   └── import/     (services, components)
└── shared/
    ├── ui/         (design system components)
    ├── api/        (unified client)
    ├── composables/ (shared hooks)
    └── types/       (truly shared types)
```

---

## Problèmes Critiques Identifiés

### 🔴 P0 - Corrections Urgentes

| # | Problème | Fichier | Impact |
|---|----------|---------|--------|
| 1 | Méthode `importFile()` manquante | `import-service.ts` | Crash runtime |
| 2 | `JSON.parse()` sans try/catch | `auth.ts` (x2) | Crash si corruption localStorage |
| 3 | `catch(e){}` vide | `CheckoutPage.vue` | Erreurs silencieuses |
| 4 | `CartItem` dupliqué | `types/product.ts` ↔ `types/cart.ts` | Conflit runtime |

### 🟠 P1 - Améliorations Importantes

| # | Problème | Impact |
|---|----------|--------|
| 5 | Syntaxe Pinia incohérente (options vs composition) | Maintenance difficile |
| 6 | `placeOrder()` dupliqué | `checkout.ts` ↔ `order.ts` |
| 7 | API client avec 2 implémentations | Incohérence comportementale |
| 8 | Composants monolithiques non factorisés | Code non réutilisable |

---

## Phase 1: Corrections Critiques (Jour 1)

### 1.1 Corriger ImportService
```
src/shared/services/import-service.ts
```

**Actions:**
- Ajouter `importFile(file: File, endpoint: string): Promise<void>`
- Ajouter `importGoogleSheet(url: string, endpoint: string): Promise<void>`
- Corriger les bindings dans `Import.vue`

### 1.2 Corriger Auth Stores
```
src/frontoffice/stores/auth.ts
src/backoffice/stores/auth.ts
```

**Avant:**
```typescript
user.value = JSON.parse(stored); // RISQUE CRASH
```

**Après:**
```typescript
try {
  user.value = JSON.parse(stored);
} catch {
  localStorage.removeItem('user');
}
```

### 1.3 Dédoublonner CartItem
```
src/shared/types/product.ts
```

**Supprimer:** lignes 18-22 (`CartItem` interface)  
**Garder uniquement:** `src/shared/types/cart.ts`

### 1.4 Ajouter gestion d'erreur
```
src/frontoffice/pages/CheckoutPage.vue
```

**Avant:**
```typescript
} catch (e) {} // VIDE
```

**Après:**
```typescript
} catch (e: any) {
  error.value = e?.message || 'Erreur lors de la commande';
}
```

---

## Phase 2: Infrastructure Partagée (Jour 2)

### 2.1 Design System - Tokens CSS
```
src/shared/ui/styles/tokens.css
```

```css
:root {
  /* Colors */
  --color-primary: #0f172a;
  --color-surface: #ffffff;
  --color-bg: #f8fafc;
  --color-border: #e2e8f0;
  --color-text-main: #1e293b;
  --color-text-muted: #64748b;
  --color-accent: #7f1d1d;
  --color-danger: #b00020;
  --color-success: #1b5e20;

  /* Typography */
  --font-main: 'Manrope', sans-serif;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 300ms ease;
}
```

### 2.2 API Client Unifié
```
src/shared/api/client.ts
```

```typescript
interface ApiClientConfig {
  baseURL: string;
  authMode: 'basic' | 'cookie' | 'bearer';
  apiKey?: string;
  timeout?: number;
}

function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout ?? 30000,
    headers: { 'Content-Type': 'application/xml' },
    ...(config.authMode === 'basic' && config.apiKey
      ? { auth: { username: config.apiKey, password: '' } }
      : {}),
  });

  client.interceptors.response.use(
    r => r,
    err => {
      console.error('API Error', err.response?.status);
      return Promise.reject(err);
    }
  );

  return client;
}

export const frontofficeApi = createApiClient({ baseURL: '...', authMode: 'cookie' });
export const backofficeApi = createApiClient({ baseURL: '...', authMode: 'basic', apiKey: '...' });
```

### 2.3 Composable useAsync
```
src/shared/composables/useAsync.ts
```

```typescript
export function useAsync<T>(fn: () => Promise<T>) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;
    try {
      data.value = await fn();
    } catch (err: any) {
      error.value = err?.message || 'Erreur inattendue';
    } finally {
      loading.value = false;
    }
  };

  return { data, loading, error, execute };
}
```

### 2.4 Extraire extractLanguageValue
```
src/shared/utils/extractLanguageValue.ts
```

---

## Phase 3: Composants Partagés (Jour 3)

### 3.1 Composants Base (Design System)
```
src/shared/ui/components/
├── BaseButton.vue      # Variants: primary, secondary, outline, danger
├── BaseInput.vue       # Types: text, email, tel, number + validation
├── BaseSelect.vue      # Options avec support recherche
├── BaseModal.vue       # Portal, trap focus, escape close
├── BaseBadge.vue       # Status colors
└── LoadingSpinner.vue  # Tailles: sm, md, lg
```

### 3.2 Composants Migrés
```
src/shared/ui/components/
├── StatusBadge.vue     # from backoffice/components/
├── PageHeader.vue      # from backoffice/components/
└── Sidebar.vue         # from backoffice/components/
```

### 3.3 Composants Métier
```
src/features/products/components/
├── ProductGrid.vue     # extracted from ShopPage
├── ProductCard.vue     # existing, move here
├── ProductFilters.vue  # existing, move here
└── ProductTable.vue    # complete stub implementation

src/features/cart/components/
├── CartDrawer.vue
└── CartItemRow.vue
```

### 3.4 Layouts Refactorés
```
src/frontoffice/layouts/DefaultLayout.vue  # fix typo
src/backoffice/layouts/AdminLayout.vue     # integrate Sidebar properly
```

---

## Phase 4: Standardisation Stores (Jour 4)

### 4.1 Uniformiser Pinia - Syntaxe Composition API

**Avant (options API):**
```typescript
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null }),
  actions: { login() {} }
});
```

**Après (composition API):**
```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const login = async () => { /* ... */ };
  return { user, login };
});
```

**Fichiers à migrer:**
- `src/backoffice/stores/auth.ts`
- `src/backoffice/stores/product.ts`

### 4.2 Corriger Duplications

**checkout.ts + order.ts** - `placeOrder()` identique dans les deux

**Solution:** Garder uniquement dans `checkout.ts`, supprimer de `order.ts`

### 4.3 Remplacer Types any[]

| Fichier | Remplacer |
|---------|-----------|
| `frontoffice/stores/auth.ts` | `user: ref<User \| null>` |
| `backoffice/stores/product.ts` | `products: Product[]` |
| Services API | `get<Product[]>()` |

---

## Phase 5: Polish & Validation (Jour 5)

### 5.1 États UI Manquants

| Page | État à ajouter |
|------|----------------|
| ShopPage | Skeleton loading, "no results" après filtrage |
| CheckoutPage | Validation email/tel/code postal |
| CheckoutPage | Spinner sur bouton soumission |
| ProductTable | Loading state |

### 5.2 Audit Code Mort

**Supprimer:**
- `src/shared/composables/useAuth.ts` (dead code, jamais utilisé)
- `src/frontoffice/pages/ShopPage.vue:34` (categories non utilisé)
- `src/frontoffice/components/` → migrer vers features/

### 5.3 Validation Build

```bash
npm run typecheck  # Doit passer sans erreur
npm run build      # Doit générer les 2 apps
npm run lint       # Si configuré
```

---

## ADR - Decisions d'Architecture

### ADR-001: Structure features/
**Contexte:** Code groupé par application (frontoffice/backoffice) crée duplication
**Décision:** Introduire `features/` par domaine métier
**Conséquences:** Migration requise, mais maintenance simplifiée

### ADR-002: API Client Factory
**Contexte:** 2 axios instances avec comportements différents
**Décision:** Single factory avec config par app
**Conséquences:** Intercepteurs unifiés, timeout configurable

### ADR-003: Pinia Composition API Only
**Contexte:** Mix options/composition APIs
**Décision:** Standardiser composition API (setup stores)
**Conséquences:** Syntaxe cohérente, TypeScript inference améliorée

### ADR-004: Types Domaines
**Contexte:** `CartItem` dupliqué
**Décision:** Types dans leur domaine (`features/cart/types/`)
**Conséquences:** Import paths changent, pas de conflits

---

## Checklist par Jour

### Jour 1 ✅
- [ ] import-service.ts: ajouter importFile(), importGoogleSheet()
- [ ] auth.ts (frontoffice): try/catch JSON.parse()
- [ ] auth.ts (backoffice): try/catch JSON.parse()
- [ ] types/product.ts: supprimer CartItem
- [ ] CheckoutPage.vue: gestion erreur catch

### Jour 2 ✅
- [ ] tokens.css: créer design system
- [ ] client.ts: refactor factory
- [ ] useAsync.ts: créer composable
- [ ] extractLanguageValue.ts: extraire utility

### Jour 3 ✅
- [ ] BaseButton.vue, BaseInput.vue, BaseSelect.vue, BaseModal.vue, LoadingSpinner.vue
- [ ] Migrer StatusBadge, PageHeader, Sidebar
- [ ] ProductGrid.vue: extraire de ShopPage
- [ ] Layouts: corriger DefaultLayout, AdminLayout

### Jour 4 ✅
- [ ] backoffice/stores/auth.ts: migration composition API
- [ ] backoffice/stores/product.ts: migration composition API
- [ ] checkout.ts: supprimer placeOrder() dupliqué
- [ ] Remplacer tous les any[]

### Jour 5 ✅
- [ ] Skeleton loading ShopPage
- [ ] Validation formulaire checkout
- [ ] Supprimer code mort
- [ ] npm run typecheck && npm run build

---

## Non Inclus (Phase 2+)

Ces améliorations nécessitent plus de temps:

| Item | Priorité | Temps estimé |
|------|----------|--------------|
| Tests unitaires (Vitest) | Haute | 2 jours |
| Proxy backend (sécurité API key) | Haute | 1 jour |
| Batch processing import (Promise.all) | Moyenne | 4h |
| Support ZIP imports | Moyenne | 4h |
| i18n (internationalisation) | Basse | 2 jours |

---

*Plan généré par Agents Orchestrator + Senior Developer + cortex-director*  
*Date: 12 Mai 2026*  
*Échéance: 5 jours*