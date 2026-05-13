import type { MappingConfig } from '../types/import.types';

const defaultMapping: MappingConfig = {
  product: {
    columns: {
      'reference': 'reference',
      'name': 'name',
      'description': 'description',
      'price': 'price',
      'quantity': 'quantity',
      'category': 'id_category_default',
      'manufacturer': 'manufacturer',
      'ean13': 'ean13',
      'isbn': 'isbn',
      'upc': 'upc',
      'weight': 'weight',
      'active': 'active',
    },
    detectionColumns: ['reference', 'name', 'price'],
    fixedValues: {
      'active': '1',
    },
  },
  combination: {
    columns: {
      'product_reference': 'id_product',
      'reference': 'reference',
      'ean13': 'ean13',
      'upc': 'upc',
      'quantity': 'quantity',
      'price': 'price',
      'weight': 'weight',
    },
    detectionColumns: ['product_reference', 'reference'],
  },
  customer: {
    columns: {
      'email': 'email',
      'firstname': 'firstname',
      'lastname': 'lastname',
      'company': 'company',
      'address1': 'address1',
      'address2': 'address2',
      'city': 'city',
      'postcode': 'postcode',
      'country': 'id_country',
      'phone': 'phone',
    },
    detectionColumns: ['email', 'firstname', 'lastname'],
  },
  order: {
    columns: {
      'reference': 'reference',
      'customer_email': 'id_customer',
      'total_paid': 'total_paid',
      'payment': 'payment',
      'status': 'current_state',
      'date_add': 'date_add',
    },
    detectionColumns: ['reference', 'total_paid'],
  },
  category: {
    columns: {
      'name': 'name',
      'description': 'description',
      'parent_id': 'id_parent',
      'active': 'active',
    },
    detectionColumns: ['name'],
    fixedValues: {
      'active': '1',
    },
  },
};

export async function loadMappingConfig(): Promise<MappingConfig> {
  return defaultMapping;
}

export function getColumnMappings(entity: string, config: MappingConfig): Record<string, string> {
  return config[entity]?.columns || defaultMapping[entity]?.columns || {};
}

export function getFixedValues(entity: string, config: MappingConfig): Record<string, string> {
  return config[entity]?.fixedValues || defaultMapping[entity]?.fixedValues || {};
}

export function getDetectionColumns(entity: string, config: MappingConfig): string[] {
  return config[entity]?.detectionColumns || defaultMapping[entity]?.detectionColumns || [];
}
