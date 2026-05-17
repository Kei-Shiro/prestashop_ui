# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev:front      # frontoffice dev server (port default)
npm run dev:back       # backoffice dev server
npm run build:front    # build frontoffice → dist/frontoffice/
npm run build:back     # build backoffice  → dist/backoffice/
npm run build          # build both
npm run test:unit      # unit tests via Vitest (vitest run)
```

No lint or type-check scripts are configured; use `vue-tsc` manually if needed.

## Environment

Copy `.env` and set:
- `VITE_PS_API_KEY` — PrestaShop WebService key (used by `src/shared/api/client.ts` for Basic auth)

Separate `.env.frontoffice` and `.env.backoffice` files exist for per-app overrides.

## Architecture

This project is **two independent SPAs** built from a single repo, sharing a `src/features/` and `src/shared/` layer.

### Dual-app split

| | Frontoffice | Backoffice |
|---|---|---|
| Entry HTML | `index.front.html` | `index.back.html` |
| Vite config | `vite.config.front.ts` | `vite.config.back.ts` |
| Main | `src/frontoffice/main.ts` | `src/backoffice/main.ts` |
| Router base | `/` | `/admin/` |
| Output | `dist/frontoffice/` | `dist/backoffice/` |

### Path aliases (defined per Vite config)

- `@shared` → `src/shared/`
- `@features` → `src/features/`
- `@front` → `src/frontoffice/` (frontoffice config only)
- `@back` → `src/backoffice/` (backoffice config only)

### Feature modules (`src/features/`)

Business logic is organized by domain, shared between both apps:

- **auth** — `customerAuthStore` (frontoffice, session + anonymous mode), `adminAuthStore` (backoffice, token from `localStorage.admin_token`). Two stores with the same Pinia ID `'auth'` — one per app bundle.
- **catalog** — product/category services, `useProduct` / `useProductFilters` composables, display components (`ProductCard`, `ProductGrid`, `ProductFilters`, `ProductTable`)
- **checkout** — `cartStore` (localStorage-backed, per-user key `front_cart_<userId>`), `checkoutStore`, `orderService`, `cartService`
- **inventory/import** — CSV/XLSX import pipeline: `productImportService`, `combinationImportService`, `orderImportService`, `imageImportService`
- **dashboard** — shared admin UI atoms (Sidebar, PageHeader, StatusBadge)

### PrestaShop WebService API

All API calls hit `/prestashop/api` (proxied by Vite to `http://localhost`). The API is **XML-only**:

- `src/shared/api/client.ts` — Axios instance with Basic auth (`VITE_PS_API_KEY` as username, empty password)
- `src/shared/api/api-service.ts` — thin wrapper that auto-serializes/deserializes XML via `Serializer`
- `src/shared/utils/serializer.ts` — `Serializer.toXml(obj)` wraps in `<prestashop>`, `Serializer.fromXml(xml)` unwraps it
- `src/shared/utils/extractLanguageValue.ts` — extracts text from PS multilingual fields (`{ language: { '@_id': 1, '#text': '...' } }`)

Always use `apiService` (not the raw Axios client) for new service calls — it handles the XML round-trip automatically.

### Cart persistence

`cartStore` uses a localStorage key per user: `front_cart_anonymous` or `front_cart_<ps_customer_id>`. On login, the anonymous cart merges into the user cart (`mergeAnonymous: true`), then `syncServerCarts()` in `customerAuthStore` fetches open PS carts from the server and merges again. PrestaShop is treated as the source of truth for open carts after login.

### Import pipeline

`src/features/inventory/import/services/` contains the bulk-import services. They follow the pattern: parse CSV/XLSX → deduplicate → check PS for existing records → create missing ones via `apiService.post`. `productImportService` handles taxes and categories as prerequisites before creating products. `src/shared/utils/endpoints.ts` documents the full ordered list of erasable vs. non-erasable PS endpoints.
