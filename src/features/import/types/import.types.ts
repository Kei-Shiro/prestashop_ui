// Type pour fichier importé
export interface ImportFile {
  id: string;
  file: File;
  name: string;
  type: 'csv' | 'zip';
  detectedEntity: 'product' | 'combination' | 'customer' | 'order' | 'category' | 'unknown';
  rows: number;
  preview: Record<string, string>[];
}

// Type pour le mapping de colonnes
export interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
  transform?: 'taxe_to_id' | 'categorie_to_id' | 'none';
}

// Type pour une entité (product, customer, etc.)
export interface EntityMapping {
  entity: 'product' | 'combination' | 'customer' | 'order' | 'category';
  columns: ColumnMapping[];
  fixedValues?: Record<string, string>;
}

// Type pour la progression
export interface ImportProgress {
  phase: 'parsing' | 'mapping' | 'importing' | 'complete' | 'error';
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  percentage: number;
  details: ImportDetail[];
}

// Type pour le détail d'une entité importée
export interface ImportDetail {
  entity: string;
  status: 'pending' | 'in_progress' | 'success' | 'error' | 'skipped';
  imported: number;
  failed: number;
  errors: ImportError[];
}

// Type pour erreur
export interface ImportError {
  row: number;
  field: string;
  value: string;
  message: string;
  code: 'MISSING_DEPENDENCY' | 'INVALID_VALUE' | 'API_ERROR' | 'PARSE_ERROR';
}

// Type pour un item du panier (format: [("T_01";3;"ngoza")])
export interface CartItem {
  reference: string;
  quantity: number;
  specificity: string;
}

// Type pour catégorie extraite
export interface CategoryInfo {
  name: string;
  id?: number;
  parentId: number;
}