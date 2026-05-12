# Plan d'Implémentation - Système d'Import

**Date**: 13 Mai 2026  
**Estimation**: 5 jours

---

## Semaine 1: Foundations

### Jour 1: Setup & Types

**Tâches:**
- [ ] Installer dépendances: `npm install jszip`
- [ ] Créer structure dossiers `src/features/import/`
- [ ] Créer `import.types.ts` avec tous les types
- [ ] Créer `default-mapping.json`

**Fichiers:**
```
src/features/import/
├── types/
│   └── import.types.ts
└── mapping/
    └── default-mapping.json
```

---

### Jour 2: Services Core

**Tâches:**
- [ ] Créer `csv-parser.service.ts`
- [ ] Créer `zip-extractor.service.ts`
- [ ] Créer `column-mapper.service.ts`

**csv-parser.service.ts:**
```typescript
// Fonction: parseCsvFile
// Input: File
// Output: { headers: string[], rows: Record<string, string>[] }
```

**zip-extractor.service.ts:**
```typescript
// Fonction: extractZipFile
// Input: File (ZIP)
// Output: { filename: string, content: string }[]
```

---

### Jour 3: Services Métier

**Tâches:**
- [ ] Créer `category-extractor.ts`
- [ ] Créer `cart-parser.ts`
- [ ] Créer `tax-lookup.ts`
- [ ] Créer `dependency-resolver.ts`

**category-extractor.ts:**
```typescript
// Fonction: extractCategories
// Input: ProductRows[]
// Output: { name: string, id?: number }[]
// Logique: Extraire colonne "categorie", dédupliquer
```

**cart-parser.ts:**
```typescript
// Fonction: parseCartString
// Input: "[("T_01";3;"ngoza"),("P_01";2;"mainty")]"
// Output: { reference, quantity, specificity }[]
```

---

### Jour 4: Orchestrateur

**Tâches:**
- [ ] Créer `import-orchestrator.ts`
- [ ] Implémenter les 4 passes d'import
- [ ] Gérer les erreurs et retry

**Flux:**
```
orchestrateImport(files, mapping)
  → 1. parseFiles()
  → 2. extractCategories() → createCategories()
  → 3. mapProducts() → importProducts()
  → 4. importCombinations()
  → 5. importCustomers() → importOrders()
  → 6. return ImportResult
```

---

### Jour 5: UI - Interface

**Tâches:**
- [ ] Créer `FileDropZone.vue`
- [ ] Créer `FileListItem.vue`
- [ ] Créer `ImportProgress.vue`
- [ ] Intégrer dans `ImportPage.vue`

---

## Checklist Implémentation

### Phase 1: Setup ✅
- [ ] `npm install jszip`
- [ ] Structure dossiers
- [ ] Types TypeScript
- [ ] Mapping JSON

### Phase 2: Services
- [ ] CSV Parser
- [ ] ZIP Extractor
- [ ] Column Mapper
- [ ] Category Extractor
- [ ] Cart Parser
- [ ] Tax Lookup
- [ ] Dependency Resolver

### Phase 3: Orchestrateur
- [ ] Import Orchestrator
- [ ] Gestion erreurs
- [ ] Progression UI

### Phase 4: UI
- [ ] FileDropZone
- [ ] FileListItem
- [ ] ImportProgress
- [ ] Integration ImportPage

### Phase 5: Tests
- [ ] Test avec fichier1.csv
- [ ] Test avec fichier2.csv
- [ ] Test avec fichier3.csv
- [ ] Test ZIP extraction
- [ ] Test gestion erreurs

---

## Commandes Utiles

```bash
# Installation jszip
npm install jszip

# Lancer dev
npm run dev:back

# Build
npm run build:back
```

---

## Points à Valider avec l'Utilisateur

1. **Mapping Taxes**: Confirmer les IDs pour chaque taux (0%, 5.5%, 11.65%, 20%)
2. **États Commandes**: Confirmer le mapping pour "paiement accepté" → ID état PS
3. **Catégorie Parent**: ID=2 (Home) est correct pour les nouvelles catégories?
4. **Champs Optionnels**:哪些 champs sont obligatoires vs optionnels?
