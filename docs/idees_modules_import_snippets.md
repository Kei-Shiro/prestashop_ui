# Snippets & Intégration : Nouveaux Modules d'Import

Ce document contient le code prêt à être intégré pour étendre votre système d'importation actuel. Les snippets respectent votre architecture (Vue 3, `apiService`, `fast-xml-parser`, `extractIdValue`).

---

## 1. Import des Prix Spécifiques (Promotions & Soldes)

**Utilité :** Permet d'importer un fichier `promotions.csv` pour appliquer des réductions (pourcentage ou montant fixe) sur des produits existants.
**Colonnes CSV :** `reference`, `type_reduction` (percentage ou amount), `valeur_reduction`, `date_debut`, `date_fin`.

### A. Nouveaux Types (`src/shared/types/import.ts`)
Ajoutez ceci à vos interfaces :
```typescript
export interface PromoCSVRow {
  reference: string;
  type_reduction: 'percentage' | 'amount';
  valeur_reduction: string;
  date_debut?: string; // YYYY-MM-DD HH:MM:SS
  date_fin?: string;   // YYYY-MM-DD HH:MM:SS
}

export interface SpecificPrice {
  id_product: number;
  id_shop: number;
  id_shop_group: number;
  id_currency: number;
  id_country: number;
  id_group: number;
  id_customer: number;
  price: number; // -1 pour utiliser le prix de base
  from_quantity: number;
  reduction: number;
  reduction_tax: number; // 0 = HT, 1 = TTC
  reduction_type: 'amount' | 'percentage';
  from: string;
  to: string;
}
```

### B. Service d'Import (`src/features/inventory/import/services/promoImportService.ts`)
Créez ce nouveau fichier :
```typescript
import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService"; // Réutilise la map existante
import type { PromoCSVRow, SpecificPrice } from "@shared/types/import";
import { ImportValidator } from "@shared/utils/import-validator";

export const importPromotions = async (csvFile: File): Promise<void> => {
  const text = await csvFile.text();

  return new Promise((resolve, reject) => {
    Papa.parse<any>(text, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const metaFields = (results.meta.fields || []).map(f => f.trim());
          const colMap = ImportValidator.validateColumns(metaFields, ['reference', 'type_reduction', 'valeur_reduction']);

          for (const row of results.data) {
            const ref = row[colMap['reference']].trim();
            const productData = productMap.get(ref);

            if (!productData) {
              console.warn(`[PromoImport] Produit introuvable pour la référence ${ref}`);
              continue;
            }

            const typeReduc = row[colMap['type_reduction']].trim() === 'percentage' ? 'percentage' : 'amount';
            let valReduc = ImportValidator.validatePositiveAmount(row[colMap['valeur_reduction']], 'valeur_reduction');
            
            // Si c'est un pourcentage, PrestaShop attend une valeur entre 0 et 1 (ex: 0.20 pour 20%)
            if (typeReduc === 'percentage') {
                valReduc = valReduc / 100;
            }

            const dateDebut = row['date_debut'] ? ImportValidator.validateDateFormat(row['date_debut'], 'date') : '0000-00-00 00:00:00';
            const dateFin = row['date_fin'] ? ImportValidator.validateDateFormat(row['date_fin'], 'date') : '0000-00-00 00:00:00';

            const specificPricePayload: SpecificPrice = {
              id_product: productData.id_product,
              id_shop: 0,
              id_shop_group: 0,
              id_currency: 0,
              id_country: 0,
              id_group: 0,
              id_customer: 0,
              price: -1,
              from_quantity: 1,
              reduction: parseFloat(valReduc.toFixed(6)),
              reduction_tax: 1,
              reduction_type: typeReduc,
              from: dateDebut,
              to: dateFin
            };

            await apiService.post('/specific_prices', { specific_price: specificPricePayload });
            console.log(`[PromoImport] Promotion ajoutée pour le produit ${ref}`);
          }
          resolve();
        } catch (err) {
          console.error("Erreur Import Promo:", err);
          reject(err);
        }
      }
    });
  });
};
```

---

## 2. Import des Caractéristiques (Features)

**Utilité :** Ajouter des informations techniques (Matière: Coton, Marque: Nike) visibles en Front-office.

### A. Nouveaux Types (`src/shared/types/import.ts`)
```typescript
export interface FeatureCSVRow {
  reference: string;
  nom_caracteristique: string; // Ex: "Matière"
  valeur_caracteristique: string; // Ex: "Coton"
}

export interface ProductFeature {
  name: LValue;
}

export interface ProductFeatureValue {
  id_feature: number;
  value: LValue;
  custom: number; // 0 pour pré-défini, 1 pour personnalisé
}
```

### B. Service (`src/features/inventory/import/services/featureImportService.ts`)
```typescript
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService";
import { extractIdValue } from "@shared/utils/extractIdValue";
import { ensureArray } from "@shared/utils/arrayUtils";
import type { LValue, ProductFeature, ProductFeatureValue } from "@shared/types/import";

const featureMap = new Map<string, number>();
const featureValueMap = new Map<string, number>();

const toLValue = (text: string): LValue => ({ language: { '@_id': 1, '#text': text } });

export const processFeatureRow = async (ref: string, featureName: string, featureValue: string) => {
    const productData = productMap.get(ref);
    if (!productData) return;

    // 1. Créer ou récupérer la Feature (Ex: "Matière")
    let idFeature = featureMap.get(featureName);
    if (!idFeature) {
        try {
            const ext = await apiService.get<any>(`/product_features?filter[name]=${encodeURIComponent(featureName)}&display=[id]`);
            const found = ensureArray(ext?.prestashop?.product_features?.product_feature)[0];
            if (found) idFeature = Number(extractIdValue(found.id));
            else {
                const res = await apiService.post<any>('/product_features', { product_feature: { name: toLValue(featureName) } });
                idFeature = Number(extractIdValue(res?.prestashop?.product_feature?.id));
            }
            if(idFeature) featureMap.set(featureName, idFeature);
        } catch(e) {}
    }
    if (!idFeature) return;

    // 2. Créer ou récupérer la Value (Ex: "Coton")
    const valKey = `${idFeature}_${featureValue}`;
    let idFeatureValue = featureValueMap.get(valKey);
    if (!idFeatureValue) {
        try {
            const ext = await apiService.get<any>(`/product_feature_values?filter[id_feature]=${idFeature}&filter[value]=${encodeURIComponent(featureValue)}&display=[id]`);
            const found = ensureArray(ext?.prestashop?.product_feature_values?.product_feature_value)[0];
            if (found) idFeatureValue = Number(extractIdValue(found.id));
            else {
                const res = await apiService.post<any>('/product_feature_values', { 
                    product_feature_value: { id_feature: idFeature, value: toLValue(featureValue), custom: 0 } 
                });
                idFeatureValue = Number(extractIdValue(res?.prestashop?.product_feature_value?.id));
            }
            if(idFeatureValue) featureValueMap.set(valKey, idFeatureValue);
        } catch(e) {}
    }
    if (!idFeatureValue) return;

    // 3. Lier la Feature au Produit via PATCH
    try {
        // On récupère d'abord les features existantes pour ne pas les écraser
        const prodRes = await apiService.get<any>(`/products/${productData.id_product}`);
        const product = prodRes.prestashop.product;
        
        let existingFeatures = ensureArray(product.associations?.product_features?.product_feature || []);
        
        // Si elle n'existe pas déjà sur ce produit
        if (!existingFeatures.some(f => Number(extractIdValue(f.id)) === idFeatureValue)) {
            existingFeatures.push({
                id: idFeature,
                id_feature_value: idFeatureValue
            });

            await apiService.patch(`/products/${productData.id_product}`, {
                product: {
                    id: productData.id_product,
                    associations: { product_features: { product_feature: existingFeatures } }
                }
            });
            console.log(`Feature ${featureName}:${featureValue} liée au produit ${ref}`);
        }
    } catch(e) {
        console.error("Erreur liaison feature", e);
    }
};
```

---

## 3. UI/UX : Barre de Progression & Export d'Erreurs

**Utilité :** Indiquer à l'utilisateur où en est l'import et lui donner un rapport des lignes qui ont échoué.

### A. Modification d'un Service (`productImportService.ts`)
Ajoutez des callbacks à votre fonction d'import.

```typescript
// On modifie la signature pour accepter des callbacks
export const importProducts = async (
    csvFile: File, 
    onProgress?: (current: number, total: number) => void,
    onErrorLog?: (errorMsg: string) => void
): Promise<void> => {
    // ... dans le Papa.parse complete :
    const rows = results.data;
    const total = rows.length;
    let current = 0;

    for (const row of rows) {
        try {
            await processProductRow(row); // Votre logique existante
        } catch (err: any) {
            if (onErrorLog) onErrorLog(`Ligne ${current + 1} (Ref: ${row.reference}) : ${err.message}`);
        }
        
        current++;
        if (onProgress) onProgress(current, total);
    }
}
```

### B. Intégration Vue (`ImportPage.vue`)
```vue
<script setup lang="ts">
import { ref, computed } from 'vue';

const progressCount = ref(0);
const progressTotal = ref(0);
const errorLogs = ref<string[]>([]);

const progressPercent = computed(() => {
    if (progressTotal.value === 0) return 0;
    return Math.round((progressCount.value / progressTotal.value) * 100);
});

const handleImport = async () => {
    progressCount.value = 0;
    progressTotal.value = 0;
    errorLogs.value = [];
    
    try {
        await importProducts(
            myFile.value,
            (current, total) => {
                progressCount.value = current;
                progressTotal.value = total;
            },
            (err) => {
                errorLogs.value.push(err);
            }
        );
    } catch (e) {
        // ...
    }
};

const downloadErrors = () => {
    const blob = new Blob([errorLogs.value.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rapport_erreurs_import.txt';
    a.click();
    URL.revokeObjectURL(url);
};
</script>

<template>
    <!-- Jauge de progression -->
    <div v-if="progressTotal > 0" class="progress-container">
        <p>Importation en cours... {{ progressCount }} / {{ progressTotal }}</p>
        <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
    </div>

    <!-- Bouton téléchargement erreurs -->
    <div v-if="errorLogs.length > 0" class="error-container">
        <p class="text-danger">{{ errorLogs.length }} erreur(s) détectée(s).</p>
        <button @click="downloadErrors" class="btn-error">Télécharger le rapport d'erreurs</button>
    </div>
</template>

<style scoped>
.progress-bar {
    width: 100%;
    height: 20px;
    background-color: #f3f3f3;
    border-radius: 10px;
    overflow: hidden;
}
.progress-fill {
    height: 100%;
    background-color: #4CAF50;
    transition: width 0.3s ease;
}
.btn-error {
    background-color: #f44336;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}
</style>
```