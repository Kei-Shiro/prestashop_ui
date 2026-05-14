# PrestaShop UI - État du Projet

**Version**: 1.0.0  
**Date**: Mai 2026  
**Stack**: Vue 3.5 + Vite + Pinia + TypeScript + TailwindCSS

---

## 📊 Statistiques

| Catégorie | Nombre |
|-----------|--------|
| **Fichiers totaux** | ~130 |
| **Pages Frontoffice** | 7 |
| **Pages Backoffice** | 5 |
| **Composants partagés** | 9 |
| **Composants feature** | 6 |
| **Services** | 13 |
| **Types** | 9 |
| **Composables** | 5 |
| **Stores Pinia** | 6 |

---

## 🏗️ Architecture

```
prestaShop_ui/
├── src/
│   ├── apps/                      # (futur) Applications
│   │   ├── frontoffice/          # Interface client
│   │   └── backoffice/           # Interface admin
│   │
│   ├── features/                   # Composants par domaine
│   │   ├── products/
│   │   │   └── components/
│   │   │       ├── ProductCard.vue
│   │   │       ├── ProductFilters.vue
│   │   │       └── ProductGrid.vue
│   │   │
│   │   └── cart/
│   │       └── components/
│   │           ├── CartDrawer.vue
│   │           └── CartItemRow.vue
│   │
│   ├── shared/                     # Code partagé
│   │   ├── api/
│   │   │   └── client.ts          # API client factory
│   │   │
│   │   ├── components/            # (legacy - migrer)
│   │   │
│   │   ├── composables/
│   │   │   ├── useAsync.ts       # Wrapper async générique
│   │   │   ├── useCheckout.ts
│   │   │   ├── useOrders.ts
│   │   │   ├── useProduct.ts
│   │   │   └── useProductFilters.ts
│   │   │
│   │   ├── services/
│   │   │   ├── api-service.ts
│   │   │   ├── auth-front-service.ts
│   │   │   ├── cart-service.ts
│   │   │   ├── categorie-service.ts
│   │   │   ├── customer-service.ts
│   │   │   ├── import-service.ts
│   │   │   ├── order-service.ts
│   │   │   ├── product-service.ts
│   │   │   ├── reset-service.ts
│   │   │   └── import_type/
│   │   │       ├── csv-import.ts
│   │   │       ├── excel-import.ts
│   │   │       └── sheet-import.ts
│   │   │
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── cart.ts
│   │   │   ├── categorie.ts
│   │   │   ├── checkout.ts
│   │   │   ├── customer.ts
│   │   │   ├── order.ts
│   │   │   ├── product.ts
│   │   │   └── user.ts
│   │   │
│   │   ├── ui/
│   │   │   ├── styles/
│   │   │   │   └── tokens.css    # Design system
│   │   │   └── components/
│   │   │       ├── BaseBadge.vue
│   │   │       ├── BaseButton.vue
│   │   │       ├── BaseInput.vue
│   │   │       ├── BaseModal.vue
│   │   │       ├── BaseSelect.vue
│   │   │       ├── LoadingSpinner.vue
│   │   │       ├── PageHeader.vue
│   │   │       ├── Sidebar.vue
│   │   │       └── StatusBadge.vue
│   │   │
│   │   └── utils/
│   │       ├── endpoints.ts
│   │       ├── extractLanguageValue.ts
│   │       ├── prestashop-columns.json
│   │       └── xml-parser.ts
│   │
│   ├── backoffice/                # Application Admin
│   │   ├── components/           # (legacy - migrer vers shared)
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   ├── stores/
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   └── frontoffice/              # Application Client
│       ├── components/           # (legacy - migrer vers features)
│       ├── layouts/
│       ├── pages/
│       ├── router/
│       ├── stores/
│       ├── App.vue
│       └── main.ts
│
├── dist/                          # Build outputs
│   ├── backoffice/
│   └── frontoffice/
│
├── docs/
├── public/
├── index.front.html              # Entry point client
├── index.back.html               # Entry point admin
├── vite.config.ts               # Base config
├── vite.config.front.ts         # Client build
├── vite.config.back.ts          # Admin build
└── package.json
```

---

## 🎨 Design System

### Tokens CSS (`tokens.css`)

```css
:root {
  /* Couleurs */
  --color-primary: #0f172a;
  --color-surface: #ffffff;
  --color-bg: #f8fafc;
  --color-border: #e2e8f0;
  --color-text-main: #1e293b;
  --color-text-muted: #64748b;
  --color-accent: #7f1d1d;
  --color-danger: #b00020;
  --color-success: #1b5e20;
  --color-accent-light: #eff6ff;

  /* Typographie */
  --font-main: 'Manrope', sans-serif;

  /* Espacements */
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

---

## 🧩 Composants UI Partagés

### BaseButton

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `primary \| secondary \| outline \| danger` | `primary` | Style du bouton |
| `size` | `sm \| md \| lg` | `md` | Taille |
| `disabled` | `boolean` | `false` | Désactivé |
| `loading` | `boolean` | `false` | État chargement |

### BaseInput

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `modelValue` | `string \| number` | - | v-model |
| `type` | `text \| email \| tel \| number \| password` | `text` | Type input |
| `label` | `string` | - | Label |
| `placeholder` | `string` | - | Placeholder |
| `error` | `string` | - | Message erreur |
| `required` | `boolean` | `false` | Requis |

### BaseSelect

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `modelValue` | `string \| number` | - | v-model |
| `options` | `{value, label}[]` | - | Options |
| `label` | `string` | - | Label |
| `placeholder` | `string` | - | Placeholder |
| `error` | `string` | - | Message erreur |

### BaseModal

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `show` | `boolean` | - | Visibilité |
| `title` | `string` | - | Titre |
| `size` | `sm \| md \| lg \| xl` | `md` | Taille |

**Slots**: `default` (contenu), `footer` (actions)

### BaseBadge

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `variant` | `success \| warning \| danger \| info \| neutral` | `neutral` | Couleur |
| `size` | `sm \| md` | `md` | Taille |

### LoadingSpinner

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `size` | `sm \| md \| lg` | `md` | Taille spinner |

---

## 🛣️ Routes

### Frontoffice (Client)

| Chemin | Page | Auth |
|--------|------|------|
| `/` | UserSelectionPage | Non |
| `/shop` | ShopPage | Non |
| `/product/:id` | ProductDetailPage | Non |
| `/cart` | CartPage | Non |
| `/checkout` | CheckoutPage | **Oui** |
| `/order-confirmation/:orderId` | OrderConfirmationPage | **Oui** |
| `/orders` | MyOrderPage | **Oui** |

### Backoffice (Admin)

| Chemin | Page | Auth |
|--------|------|------|
| `/admin/login` | LoginPage | Non |
| `/admin/import` | ImportPage | **Oui** |
| `/admin/reset` | ResetPage | **Oui** |
| `/admin/orders` | OrdersPage | **Oui** |
| `/admin/` | redirect → /orders | - |

---

## 📦 State Management (Pinia)

### Stores Frontoffice

| Store | Responsabilité |
|-------|----------------|
| `auth` | Session client, login/logout |
| `cart` | Panier, ajout/suppression produits |
| `checkout` | Passage commande, validation |
| `order` | Historique commandes |

### Stores Backoffice

| Store | Responsabilité |
|-------|----------------|
| `auth` | Authentification admin |
| `product` | Gestion produits |

**Pattern**: Composition API (`defineStore(() => {...})`)

---

## 🔌 API Client

### Configuration

```typescript
interface ApiClientConfig {
  baseURL?: string;      // '/prestashop/api'
  timeout?: number;      // 10000ms
  authMode?: 'basic' | 'bearer' | 'none';
  authToken?: string;
  apiKey?: string;       // VITE_PS_API_KEY
}
```

### Utilisation

```typescript
import { createApiClient } from '@shared/api/client';

const api = createApiClient({
  baseURL: '/prestashop/api',
  authMode: 'basic',
  apiKey: import.meta.env.VITE_PS_API_KEY
});
```

---

## ⚠️ Dette Technique Identifiée

### Haute Priorité

| Fichier | Problème | Action |
|---------|----------|--------|
| `frontoffice/stores/auth.ts:7` | `user: ref<any>(null)` | Typage User |
| `frontoffice/stores/checkout.ts:12` | `customerId = 1` hardcodé | Utiliser auth store |
| `frontoffice/stores/order.ts:12` | `customerId = 1` hardcodé | Utiliser auth store |

### Moyenne Priorité

| Fichier | Problème | Action |
|---------|----------|--------|
| `frontoffice/stores/cart.ts` | Parsing prix duplicué | Extraire utility |
| `shared/composables/useAuth.ts` | Dead code | Supprimer |
| `backoffice/stores/product.ts` | Store incomplet | Ajouter méthodes CRUD |

### Basse Priorité

| Problème | Action |
|----------|--------|
| Composants legacy non migrés | Migrer vers features/ et shared/ |
| API key exposée client-side | Ajouter proxy backend |
| Pas de tests unitaires | Ajouter Vitest |

---

## ✅ Évolutions Récentes

| Date | Description |
|------|-------------|
| Mai 2026 | Design system tokens.css créé |
| Mai 2026 | API client factory implémenté |
| Mai 2026 | Composants UI partagés créés (9) |
| Mai 2026 | Feature components cart/products créés (6) |
| Mai 2026 | Stores backoffice migrés vers Composition API |
| Mai 2026 | Skeleton loading ajouté à ShopPage |
| Mai 2026 | Validation formulaire checkout |
| Mai 2026 | Typage `any[]` remplacé par types stricts |

---

## 🚀 Scripts Disponibles

```bash
# Développement
npm run dev          # Les deux apps
npm run dev:front   # Frontoffice uniquement
npm run dev:back    # Backoffice uniquement

# Build
npm run build        # Les deux apps
npm run build:front  # Frontoffice uniquement
npm run build:back  # Backoffice uniquement

# Production
npm run preview
```

---

## 📁 Structure Build

```
dist/
├── backoffice/
│   ├── index.back.html
│   └── assets/
│       ├── index-*.css
│       └── index-*.js
│
└── frontoffice/
    ├── index.front.html
    └── assets/
        ├── index-*.css
        └── index-*.js
```

---

## 🔗 Alias Path

| Alias | Chemin |
|-------|--------|
| `@front` | `src/frontoffice` |
| `@back` | `src/backoffice` |
| `@shared` | `src/shared` |
| `@features` | `src/features` |

---

*Document généré le 13 Mai 2026*
