import JSZip from 'jszip';
import apiService from '@shared/api/api-service';
import { productMap } from './productImportService';

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

  for (const entry of imageEntries) {
    const fileName = entry.name.split('/').pop() || entry.name;
    // Extraire la référence: ex: "T_01.png" -> "T_01"
    const lastDotIndex = fileName.lastIndexOf('.');
    const reference = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName;

    const productData = productMap.get(reference);
    if (!productData) {
      console.warn(`[Images] MISSING_DEPENDENCY: Référence ${reference} absente de productMap. On passe ${fileName}.`);
      skippedCount++;
      continue;
    }

    const id_product = productData.id_product;
    
    try {
      const blob = await entry.async('blob');
      const formData = new FormData();
      formData.append('image', blob, fileName);

      await apiService.postFormData(`/images/products/${id_product}`, formData);
      console.log(`✓ Image uploadée pour ${reference} (id_product: ${id_product})`);
      successCount++;
    } catch (err) {
      console.error(`[Images] API_ERROR: Impossible d'uploader l'image ${fileName} pour la référence ${reference}:`, err);
      skippedCount++;
    }
  }

  console.log(`[Images] Import terminé. ${successCount} succès, ${skippedCount} ignorées.`);
};
