// ──────────────────── Types d'entité ────────────────────
export type EntityType = 'product' | 'combination' | 'customer' | 'order' | 'category';

// ──────────────────── Fichier importé ────────────────────
export interface ImportFile {
  id: string;
  file: File;
  name: string;
  type: 'csv' | 'zip';
  detectedEntity: EntityType | 'unknown';
  overrideEndpoint?: string; // endpoint sélectionné par l'utilisateur (fallback)
  rows: number;
  headers?: string[];
  preview: Record<string, string>[];
  imageCount?: number; // nombre d'images extraites (pour les ZIP)
}

// ──────────────────── Mapping de colonnes ────────────────────
export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  transform?: 'taxe_to_id' | 'categorie_to_id' | 'format_price' | 'none';
}

// ──────────────────── Config de mapping (JSON externe) ────────────────────
export interface MappingEntityConfig {
  columns: Record<string, string>;           // sourceCol → targetCol
  transforms?: Record<string, string>;       // sourceCol → transformName
  fixedValues?: Record<string, string>;      // champs avec valeurs par défaut
  detectionColumns?: string[];               // colonnes pour détecter cette entité
}

export interface MappingConfig {
  [entity: string]: MappingEntityConfig;
}

// ──────────────────── Entité (product, customer, etc.) ────────────────────
export interface EntityMapping {
  entity: EntityType;
  columns: ColumnMapping[];
  fixedValues?: Record<string, string>;
}

// ──────────────────── Progression ────────────────────
export interface ImportProgress {
  phase: 'parsing' | 'mapping' | 'importing' | 'images' | 'complete' | 'error';
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  percentage: number;
  details: ImportDetail[];
}

// ──────────────────── Détail d'une entité importée ────────────────────
export interface ImportDetail {
  entity: string;
  status: 'pending' | 'in_progress' | 'success' | 'error' | 'skipped';
  imported: number;
  failed: number;
  total: number;
  errors: ImportError[];
}

// ──────────────────── Erreur ────────────────────
export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
  code: 'MISSING_DEPENDENCY' | 'INVALID_VALUE' | 'API_ERROR' | 'PARSE_ERROR' | 'IMAGE_ERROR';
}

// ──────────────────── Cart item (format: [("T_01";3;"ngoza")]) ────────────────────
export interface CartItem {
  reference: string;
  quantity: number;
  specificity: string;
}

// ──────────────────── Catégorie extraite ────────────────────
export interface CategoryInfo {
  name: string;
  id?: number;
  parentId: number;
}

// ──────────────────── Image extraite d'un ZIP ────────────────────
export interface ExtractedImage {
  filename: string;
  blob: Blob;
  reference: string;   // nom du fichier sans extension (= référence produit)
  mimeType: string;
}

// ──────────────────── Résultat d'extraction ZIP ────────────────────
export interface ZipExtractionResult {
  csvFiles: { filename: string; content: string }[];
  imageFiles: ExtractedImage[];
}