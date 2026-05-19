# Snippets & Intégration : Images par Déclinaison

Ce document contient le code complet et opérationnel pour remplacer votre service d'importation d'images actuel (`src/features/inventory/import/services/imageImportService.ts`). 

Cette nouvelle version permet d'importer une image principale pour le produit, mais aussi des images spécifiques pour chaque déclinaison en se basant sur le nom du fichier.

## Règle de nommage dans le ZIP
*   **Image principale** : `REFERENCE.ext` (Ex: `T_01.jpg`)
*   **Image de déclinaison** : `REFERENCE_VALEUR.ext` (Ex: `T_01_fotsy.jpg`, `T_01_mainty.jpg`)

---

## Le code complet à remplacer

Remplacez l'intégralité du contenu de votre fichier **`src/features/inventory/import/services/imageImportService.ts`** par le code ci-dessous :

```typescript
import JSZip from 'jszip';
import apiService from '@shared/api/api-service';
import { productMap } from './productImportService';
import { combinationMap } from './combinationImportService';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';

export const importImages = async (zipFile: File): Promise<void> => {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipFile);
  } catch (err) {
    console.error("FORMAT_ERROR: Failed to read or process ZIP file", err);
    throw new Error("FORMAT_ERROR: L'archive ZIP est corrompue ou illisible.");
  }

  const imageEntries = Object.values(zip.files).filter(entry => {
    if (entry.dir) return false;
    const lowerName = entry.name.toLowerCase();
    // Ne garder que les fichiers à la racine (pas de /) et les extensions valides
    return !entry.name.includes('/') && 
           (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png'));
  });

  let successCount = 0;
  let skippedCount = 0;

  for (const entry of imageEntries) {
    const fileName = entry.name;
    const lastDotIndex = fileName.lastIndexOf('.');
    const nameWithoutExt = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

    // Décorticage du nom de fichier : "T_01" ou "T_01_fotsy"
    // On suppose que la référence ne contient pas de "_" si elle a des déclinaisons (ou on split au dernier "_")
    let reference = nameWithoutExt;
    let variation = "";

    const lastUnderscoreIndex = nameWithoutExt.lastIndexOf('_');
    
    // Pour différencier, on regarde si la référence entière existe dans productMap.
    // Si oui, c'est l'image principale. Si non, on essaie de couper au dernier '_'.
    if (!productMap.has(reference) && lastUnderscoreIndex !== -1) {
        reference = nameWithoutExt.substring(0, lastUnderscoreIndex);
        variation = nameWithoutExt.substring(lastUnderscoreIndex + 1);
    }

    const productData = productMap.get(reference);
    if (!productData) {
      console.warn(`[Images] MISSING_DEPENDENCY: Référence ${reference} absente de productMap. Fichier: ${fileName}.`);
      skippedCount++;
      continue;
    }

    const id_product = productData.id_product;
    
    try {
      // 1. UPLOAD DE L'IMAGE SUR LE PRODUIT GLOBAL
      const blob = await entry.async('blob');
      const formData = new FormData();
      formData.append('image', blob, fileName);

      const uploadRes = await apiService.postFormData<any>(`/images/products/${id_product}`, formData);
      
      // Extraction du nouvel ID de l'image (format XML retourné par l'API image de PrestaShop)
      // La réponse de l'API image est souvent brute (ex: <image><id>88</id></image>)
      const newImageIdRaw = uploadRes?.image?.id || uploadRes?.prestashop?.image?.id;
      const newImageId = Number(extractIdValue(newImageIdRaw));

      if (!newImageId) {
         console.warn(`[Images] Upload réussi pour ${fileName} mais impossible de récupérer l'ID de l'image.`);
         successCount++;
         continue;
      }

      console.log(`✓ Image uploadée pour ${reference} (id_product: ${id_product}, id_image: ${newImageId})`);

      // 2. LIAISON AVEC LA DÉCLINAISON (Si on a détecté une variation comme "fotsy")
      if (variation) {
        // Retrouver l'ID de la combinaison dans la combinationMap
        // Les clés de la map sont au format : "REFERENCE_SPECIFICITE_VALEUR" (ex: "T_01_couleur_fotsy")
        const prefix = `${reference}_`;
        const suffix = `_${variation}`;
        
        let id_combination = 0;
        for (const [key, value] of combinationMap.entries()) {
            if (key.startsWith(prefix) && key.endsWith(suffix)) {
                id_combination = value.id;
                break;
            }
        }

        if (id_combination) {
             // On doit récupérer la combinaison existante pour ne pas écraser ses attributs (prix, option_values...)
             const comboRes = await apiService.get<any>(`/combinations/${id_combination}`);
             const existingCombo = comboRes?.prestashop?.combination;

             if (existingCombo) {
                 // On prépare le tableau des images associées
                 let existingImages = ensureArray(existingCombo.associations?.images?.image || []);
                 
                 // On ajoute la nouvelle image
                 existingImages.push({ id: newImageId });

                 // On envoie le PATCH pour mettre à jour la déclinaison
                 const patchPayload = {
                     combination: {
                         id: id_combination,
                         associations: {
                             images: {
                                 image: existingImages
                             }
                         }
                     }
                 };

                 await apiService.patch(`/combinations/${id_combination}`, patchPayload);
                 console.log(`   └─ Image ${newImageId} liée avec succès à la déclinaison ${variation} (id: ${id_combination})`);
             }
        } else {
             console.warn(`   └─ Impossible de lier : La combinaison pour la variation "${variation}" n'a pas été trouvée en mémoire.`);
        }
      }

      successCount++;
    } catch (err) {
      console.error(`[Images] API_ERROR: Erreur avec l'image ${fileName}:`, err);
      skippedCount++;
    }
  }

  console.log(`[Images] Import terminé. ${successCount} succès, ${skippedCount} ignorées.`);
};
```

## Explications Techniques du Processus

1.  **Analyse du Nom** : Le code regarde `T_01_fotsy.jpg`. Il cherche d'abord si un produit s'appelle `T_01_fotsy`. Comme il ne le trouve pas, il coupe au dernier tiret (`_`) : la référence devient `T_01` et la variation devient `fotsy`.
2.  **Upload (`POSTFormData`)** : L'image physique est envoyée via l'API sur la ressource du produit global `/images/products/{id_product}`. C'est obligatoire car toutes les images doivent appartenir au produit.
3.  **Récupération de l'ID Image** : L'API nous renvoie un XML avec le nouvel `id` de l'image (ex: `88`).
4.  **Recherche de Déclinaison** : Le script parcourt votre `combinationMap` (remplie lors de l'étape 2 de votre import) pour trouver l'ID de la déclinaison correspondant à "T_01" et "fotsy".
5.  **Mise à jour (PATCH)** : Il fait une requête `PATCH` sur l'API `/combinations/{id_combination}` pour rajouter `id_image: 88` dans les associations de cette déclinaison, garantissant que l'image changera au clic sur la bonne couleur côté client !