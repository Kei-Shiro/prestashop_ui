import JSZip from 'jszip';
import apiService from '@shared/api/api-service';
import { productMap, getProductInfo } from './productImportService';
import { catalogLoader } from '@shared/services/catalog-loader';

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
    const isImage = lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerName.endsWith('.png');
    if (!isImage) return false;

    // Get the base filename (excluding directory path)
    const fileName = entry.name.split('/').pop();
    return !!fileName && fileName.length > 0;
  });

  let successCount = 0;
  let skippedCount = 0;

  await catalogLoader.runWithConcurrency(imageEntries, 5, async (entry) => {
    const fileName = entry.name.split('/').pop() || entry.name;
    // Extraire la référence: ex: "T_01.png" -> "T_01"
    const lastDotIndex = fileName.lastIndexOf('.');
    const reference = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

    const normalizedReference = reference;

    // Recherche insensible à la casse
    let productData = productMap.get(normalizedReference);
    if (!productData) {
      const matchingKey = Array.from(productMap.keys()).find(k => k.toLowerCase() === normalizedReference.toLowerCase());
      if (matchingKey) {
        productData = productMap.get(matchingKey);
      }
    }

    // Lookup dynamique si absent de la map
    if (!productData) {
      productData = (await getProductInfo(normalizedReference)) || undefined;
    }

    if (!productData) {
      console.warn(`[Images] MISSING_DEPENDENCY: Référence ${normalizedReference} (fichier ${fileName}) absente du catalogue PrestaShop. On passe.`);
      skippedCount++;
      return;
    }

    const id_product = productData.id_product;
    
    try {
      const blob = await entry.async('blob');
      const formData = new FormData();
      formData.append('image', blob, fileName);

      await apiService.postFormData(`/images/products/${id_product}`, formData);
      console.log(`✓ Image uploadée pour ${normalizedReference} (id_product: ${id_product})`);
      successCount++;
    } catch (err) {
      console.error(`[Images] API_ERROR: Impossible d'uploader l'image ${fileName} pour la référence ${normalizedReference}:`, err);
      skippedCount++;
    }
  });

  console.log(`[Images] Import terminé. ${successCount} succès, ${skippedCount} ignorées.`);
};
