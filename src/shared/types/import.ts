export interface LValue {
  language: {
    '@_id': number;
    '#text': string;
  };
}

export interface IdValue {
  '#text': number;
}

/* ### CSV1 */
export interface Category {
  id?: number;
  active: number;
  name: LValue;
  link_rewrite: LValue;
  id_parent: number; // 2
}

export interface Tax {
  id?: number;
  active: number;
  name: LValue;
  rate: number;
}

export interface TaxRuleGroup {
  id?: number;
  active: number;
  name: string;
}

export interface TaxRulePost {
  id?: number;
  id_tax: number;
  id_tax_rules_group: number;
  id_country: number; // 8
}

export interface ProductPost {
  id?: number;
  name: LValue;
  link_rewrite: LValue;
  reference: string;
  price: number;
  wholesale_price: number;
  id_tax_rules_group: number;
  id_category_default: number;
  available_date: string;
  associations: {
    categories: {
      category: Array<{
        id: number;
      }>;
    };
  };
  available_for_order: number;
  show_price: number;
  active: number;
  state: number;
  visibility: string;
  minimal_quantity: number;
  product_type: string;
  condition: string;
}

/* ### CSV2 */
export interface ProductOption {
  id?: number;
  group_type: string; // 'select'
  name: LValue;
  public_name: LValue;
}

export interface ProductOptionValue {
  id?: number;
  id_attribute_group: number;
  name: LValue;
}

export interface CombinationPost {
  id?: number;
  id_product: number;
  reference: string;
  price: number;
  minimal_quantity: number;
  associations: {
    product_option_values: {
      product_option_value: Array<{
        id: number;
      }>;
    };
  };
}

export interface StockAvailableGet {
  id: number;
  id_product: IdValue;
  id_product_attribute: number | IdValue;
  id_shop: IdValue;
  id_shop_group: number;
  quantity: number;
  depends_on_stock: number;
  out_of_stock: number;
  location: string;
}

export interface StockAvailablePut {
  id: number;
  id_product: number;
  id_product_attribute: number;
  id_shop: number;
  id_shop_group: number;
  quantity: number;
  depends_on_stock: number;
  out_of_stock: number;
  location: string;
}

export interface TaxRuleGet {
  id: number;
  id_tax_rules_group: IdValue;
  id_tax: number;
}

export interface ProductGet {
  id: number;
  id_tax_rules_group: IdValue;
  price: number;
  reference: string;
}

/* ### CSV3 */
export interface Customer {
  id?: number;
  email: string;
  passwd: string;
  lastname: string;
  firstname: string;
  active: number;
  secure_key?: string;
  id_default_group: number; // 3
}

export interface Address {
  id?: number;
  id_customer: number;
  id_country: number; // 8
  alias: string;
  lastname: string;
  firstname: string;
  address1: string;
  city: string;
}

export interface Cart {
  id?: number;
  id_currency: number; // 1
  id_lang: number; // 1
  id_carrier: number; // 1
  id_shop: number; // 1
  id_shop_group: number; // 1
  id_customer: number;
  id_address_delivery: number;
  id_address_invoice: number;
  secure_key: string;
  date_add: string;
  associations?: {
    cart_rows: {
      cart_row: CartRow[];
    };
  };
}

export interface CartRow {
  id_product: number;
  id_product_attribute: number;
  quantity: number;
  id_address_delivery: number;
}

export interface Order {
  id?: number;
  id_cart: number;
  id_currency: number; // 1
  id_lang: number; // 1
  id_carrier: number; // 1
  id_shop: number; // 1
  id_shop_group: number; // 1
  id_customer: number;
  id_address_delivery: number;
  id_address_invoice: number;
  current_state: number;
  payment: string; // 'Payment'
  module: string;
  conversion_rate: number; // 1
  total_paid: number;
  total_paid_real: number;
  total_products: number;
  total_products_wt: number;
  total_paid_tax_excl: number;
  total_paid_tax_incl: number;
  date_add: string; // format : YYYY-MM-DD
  secure_key: string;
  associations: {
    order_rows: {
      order_row: OrderRow[];
    };
  };
}

export interface OrderRow {
  product_id: number;
  product_attribute_id: number;
  product_quantity: number;
}

export interface CarrierPost {
  id?: number;
  name: string;
  active: number;
  deleted: number;
  is_free: number;
  shipping_handling: number;
  shipping_external: number;
  range_behavior: number;
  shipping_method: number;
  max_width: number;
  max_height: number;
  max_depth: number;
  max_weight: number;
  grade: number;
  delay: LValue;
}

export interface OrderState {
  id?: number;
  name: LValue;
  module_name?: string;
  color?: string;
  unremovable?: number;
  hidden?: number;
  delivery?: number;
  shipped?: number;
  send_email?: number;
  invoice?: number;
  logable?: number;
  paid?: number;
  pdf_invoice?: number;
  pdf_delivery?: number;
  deleted?: number;
}

export interface CombinationGet {
  id: number;
  id_product: IdValue;
  reference: string;
  price: number;
  associations: {
    product_option_values: {
      product_option_value: Array<{
        id: number;
      }>;
    };
  };
}

// Keep the CSV row interfaces
export interface ProductCSVRow {
  date_availability: string;
  produit: string;
  reference: string;
  prix_ttc: string;
  Taxe: string;
  categorie: string;
  prix_achat: string;
}

export interface StockCSVRow {
  reference: string;
  specificite: string;
  valeur: string;
  stock_initial: string;
  prix_vente_ttc: string;
}

export interface OrderCSVRow {
  date: string;
  nom: string;
  email: string;
  pwd: string;
  adresse: string;
  achat: string;
  etat: string;
}

export interface AchatTuple {
  ref: string;
  qty: number;
  valeur: string;
}

export interface ResolvedTuple {
  id_product: number;
  id_product_attribute: number;
  qty: number;
  unit_price_ttc: number;
  rate: number;
}

export interface ProductMapEntry {
  id_product: number;
  prix_ttc: number;
  id_tax_rules_group: number;
  rate: number;
  available_date: string;
}

export interface CombinationMapEntry {
  id: number;
  prix_ttc: number;
}

export interface StockMovement {
  id_employee: number,
  id_stock: number,
  physical_quantity: number,
  sign: number,
  id_stock_mvt_reason: number,
  price_te: number,
  date_add: string
}

export interface StockMovementDisplay {
  id_stock_mvt?: string;
  id_stock?: string;
  id_product: string;
  id_product_attribute?: string;
  combination_name?: string;
  sign: number;
  physical_quantity: number;
  date_add: string;
}