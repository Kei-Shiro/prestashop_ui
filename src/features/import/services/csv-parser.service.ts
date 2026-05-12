import Papa from 'papaparse';
import type { ImportFile } from '@features/import/types/import.types';

type EntityType = 'product' | 'combination' | 'customer' | 'order' | 'category' | 'unknown';

/**
 * Detect entity type from CSV headers
 */
function detectEntityType(headers: string[]): EntityType {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const headerSet = new Set(normalizedHeaders);

  const hasNom = headerSet.has('nom');
  const hasEmail = headerSet.has('email') || headerSet.has('e-mail');
  const hasPwd = headerSet.has('pwd') || headerSet.has('mot_de_passe') || headerSet.has('password');

  if (hasNom && hasEmail && hasPwd) {
    return 'customer';
  }

  const hasReference = headerSet.has('reference');
  const hasSpecificite = headerSet.has('spécificité') || headerSet.has('specificite') || headerSet.has('specificity');

  if (hasReference && hasSpecificite) {
    return 'combination';
  }

  const hasAchat = headerSet.has('achat') || headerSet.has('commande') || headerSet.has('order');
  const hasEtat = headerSet.has('etat') || headerSet.has('état') || headerSet.has('status');

  if (hasAchat && hasEtat) {
    return 'order';
  }

  const hasProduit = headerSet.has('produit') || headerSet.has('product') || headerSet.has('nom_produit');
  const hasPrixTtc = headerSet.has('prix_ttc') || headerSet.has('prix') || headerSet.has('price');

  if (hasProduit && hasPrixTtc) {
    return 'product';
  }

  return 'unknown';
}

/**
 * Generate unique ID for ImportFile
 */
function generateId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse CSV string and return array of records
 */
export function parseCsvString(csvContent: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  return result.data;
}

/**
 * Parse CSV file and return ImportFile object
 */
export async function parseCsvFile(file: File): Promise<ImportFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const detectedEntity = detectEntityType(headers);
        const data = results.data as Record<string, string>[];

        const importFile: ImportFile = {
          id: generateId(),
          file,
          name: file.name,
          type: 'csv',
          detectedEntity,
          rows: data.length,
          preview: data.slice(0, 5),
        };

        resolve(importFile);
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}