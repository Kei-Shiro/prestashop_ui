# Import PrestaShop - Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Implémenter un système d'import multi-fichiers (3 CSV + 1 ZIP) vers PrestaShop avec mapping configurable.

**Architecture:**
- Service d'orchestration qui coordonne le parsing CSV/ZIP, l'application du mapping, et l'import API.
- 4 passes d'import: Categories → Products → Combinations → Customers/Orders

---

## Structure des Fichiers

```
src/features/import/
├── types/
│   └── import.types.ts
├── services/
│   ├── csv-parser.service.ts
│   ├── zip-extractor.service.ts
│   ├── column-mapper.service.ts
│   ├── category-extractor.ts
│   ├── cart-parser.ts
│   ├── tax-lookup.ts
│   ├── dependency-resolver.ts
│   ├── prestashop-adapter.ts
│   └── import-orchestrator.ts
├── components/
│   ├── FileDropZone.vue
│   └── ImportProgress.vue
└── mapping/
    └── default-mapping.json
```

---

## Task 1: Setup + Types

**Files:** Create `src/features/import/types/import.types.ts`

```typescript
export interface ImportFile {
  id: string;
  file: File;
  name: string;
  type: 'csv' | 'zip';
  detectedEntity: 'product' | 'combination' | 'customer' | 'order' | 'unknown';
  rows: number;
  preview: Record<string, string>[];
}

export interface ImportProgress {
  phase: 'parsing' | 'mapping' | 'importing' | 'complete' | 'error';
  currentStep: string;
  percentage: number;
  details: ImportDetail[];
}

export interface ImportDetail {
  entity: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  imported: number;
  failed: number;
}

export interface CartItem {
  reference: string;
  quantity: number;
  specificity: string;
}
```

---

## Task 2: CSV Parser Service

**File:** Create `src/features/import/services/csv-parser.service.ts`

- Parse CSV avec PapaParse
- Détection automatique d'entité (product/combination/customer/order)

---

## Task 3: ZIP Extractor Service

**File:** Create `src/features/import/services/zip-extractor.service.ts`

- Utiliser JSZip pour extraire les CSV du ZIP

---

## Task 4: Cart Parser + Tax Lookup

**Files:**
- `src/features/import/services/cart-parser.ts` - Parse `[("T_01";3;"ngoza")]`
- `src/features/import/services/tax-lookup.ts` - Convertit "11,65%" → ID taxe

---

## Task 5: Category Extractor

**File:** `src/features/import/services/category-extractor.ts`

- Extraire catégories uniques de la colonne "categorie"
- Retourner { name, id?, parentId }

---

## Task 6: Column Mapper

**File:** `src/features/import/services/column-mapper.service.ts`

- Appliquer mapping source → target
- Gérer transformations (taxe_to_id, categorie_to_id)

---

## Task 7: Dependency Resolver

**File:** `src/features/import/services/dependency-resolver.ts`

- Ordre d'import: Categories → Products → Options → Combinations → Customers → Orders

---

## Task 8: PrestaShop Adapter

**File:** `src/features/import/services/prestashop-adapter.ts`

- buildProductXml(data) → XML produit
- buildCategoryXml(data) → XML catégorie
- importToPrestaShop(endpoint, data) → POST API

---

## Task 9: Import Orchestrator

**File:** `src/features/import/services/import-orchestrator.ts`

```typescript
async function orchestrateImport(files: ImportFile[], options) {
  // 1. Parse tous les fichiers
  // 2. Extraire catégories → créer dans PS
  // 3. Mapper catégories nom → ID
  // 4. Importer produits
  // 5. Importer combinaisons
  // 6. Importer clients
  // 7. Importer commandes
}
```

---

## Task 10: UI Components

**Files:**
- `src/features/import/components/FileDropZone.vue`
- `src/features/import/components/ImportProgress.vue`

---

## Task 11: Integration

**File:** Modifier `src/backoffice/pages/ImportPage.vue`

---

## Résumé Tasks

| # | Description |
|---|-------------|
| 1 | Types TypeScript |
| 2 | CSV Parser |
| 3 | ZIP Extractor |
| 4 | Cart Parser + Tax Lookup |
| 5 | Category Extractor |
| 6 | Column Mapper |
| 7 | Dependency Resolver |
| 8 | PrestaShop Adapter |
| 9 | Import Orchestrator |
| 10 | UI Components |
| 11 | Integration |
