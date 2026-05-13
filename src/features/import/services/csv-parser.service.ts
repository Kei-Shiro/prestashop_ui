import Papa from 'papaparse';
import type { ImportFile, EntityType } from '@features/import/types/import.types';
import { loadMappingConfig } from './mapping-loader.service';
import prestashopColumns from '@shared/utils/prestashop-columns.json';

/**
 * Détecte le type d'entité depuis les en‑têtes CSV.
 * Utilise un système de score basé sur :
 * 1. Les colonnes de détection du mapping JSON (prioritaire)
 * 2. Le matching contre les colonnes PrestaShop connues
 */
function detectEntityType(headers: string[]): EntityType | 'unknown' {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  const headerSet = new Set(normalizedHeaders);

  // ── Phase 1 : Détection par colonnes de détection (mapping JSON) ──
  const mappingConfig = loadMappingConfig();
  const entityScores: Record<string, number> = {};

  for (const [entity, config] of Object.entries(mappingConfig)) {
    let score = 0;

    // Score par colonnes de détection (poids fort)
    if (config.detectionColumns) {
      for (const col of config.detectionColumns) {
        if (headerSet.has(col.toLowerCase())) {
          score += 10;
        }
      }
    }

    // Score par colonnes du mapping (poids normal)
    if (config.columns) {
      for (const sourceCol of Object.keys(config.columns)) {
        if (headerSet.has(sourceCol.toLowerCase())) {
          score += 2;
        }
      }
    }

    entityScores[entity] = score;
  }

  // ── Phase 2 : Si les scores sont ex-aequo, matcher contre prestashop-columns.json ──
  const psColumns = prestashopColumns as Record<string, string[]>;
  for (const [entity, columns] of Object.entries(psColumns)) {
    // Normaliser le nom d'entité
    const normalizedEntity = normalizeEntityName(entity);
    if (!normalizedEntity) continue;

    let matchCount = 0;
    for (const col of columns) {
      if (headerSet.has(col.toLowerCase())) {
        matchCount++;
      }
    }

    // Ajouter au score existant (poids faible)
    if (entityScores[normalizedEntity] !== undefined) {
      entityScores[normalizedEntity] += matchCount;
    } else {
      entityScores[normalizedEntity] = matchCount;
    }
  }

  // Trouver l'entité avec le meilleur score
  let bestEntity: string = 'unknown';
  let bestScore = 0;

  for (const [entity, score] of Object.entries(entityScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestEntity = entity;
    }
  }

  // Seuil minimum : au moins 5 points pour être confiant
  if (bestScore < 5) {
    return 'unknown';
  }

  return bestEntity as EntityType;
}

/**
 * Normalise les noms d'entités prestashop-columns.json vers EntityType
 */
function normalizeEntityName(psEntity: string): EntityType | null {
  const mapping: Record<string, EntityType> = {
    product: 'product',
    category: 'category',
    combination: 'combination',
    customer: 'customer',
    order: 'order',
  };
  return mapping[psEntity] || null;
}

/**
 * Génère un identifiant unique pour ImportFile
 */
function generateId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Parse une chaîne CSV et retourne les enregistrements nettoyés
 */
export function parseCsvString(csvContent: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim().toLowerCase(),
    transform: (value: string) => value.trim(),
  });

  // Collecte des lignes avec erreurs critiques (FieldMismatch, Quotes)
  const criticalErrorRows = new Set<number>();
  result.errors.forEach((e) => {
    if (e.type === 'FieldMismatch' || e.type === 'Quotes') {
      if (e.row !== undefined) criticalErrorRows.add(e.row);
    }
  });

  const cleanData = result.data.filter((_, index) => {
    return !criticalErrorRows.has(index);
  });

  if (criticalErrorRows.size > 0) {
    console.warn(`CSV parsing: ${criticalErrorRows.size} lignes ignorées à cause d'erreurs critiques.`);
  }

  return cleanData;
}

/**
 * Parse un fichier CSV et retourne un objet ImportFile
 */
export async function parseCsvFile(file: File): Promise<ImportFile> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        const headers = results.meta.fields || [];
        const detectedEntity = detectEntityType(headers);

        // Nettoyage des données avec la même logique que parseCsvString
        const criticalErrorRows = new Set<number>();
        results.errors.forEach((e) => {
          if (e.type === 'FieldMismatch' || e.type === 'Quotes') {
            if (e.row !== undefined) criticalErrorRows.add(e.row);
          }
        });
        const data = (results.data as Record<string, string>[]).filter(
            (_, idx) => !criticalErrorRows.has(idx)
        );

        const importFile: ImportFile = {
          id: generateId(),
          file,
          name: file.name,
          type: 'csv',
          detectedEntity,
          rows: data.length,
          headers,
          preview: data.slice(0, 5),
        };

        resolve(importFile);
      },
      error: (error: Error) => {
        reject(new Error(`Échec du parsing CSV : ${error.message}`));
      },
    });
  });
}