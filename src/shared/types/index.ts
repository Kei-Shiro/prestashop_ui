/**
 * Central barrel — import all PrestaShop types from this single entry point.
 *
 * @example
 * import type { Product, ProductCreatePayload } from '@shared/types';
 * import type { Order, OrderRow }               from '@shared/types';
 */

export type { LangField, IdRef, IdOnly } from './common';

export type { Product, ProductCreatePayload, ProductUpdatePayload } from './product';
export type { Combination, CombinationCreatePayload, CombinationUpdatePayload } from './combination';
export type { Category, CategoryCreatePayload, CategoryUpdatePayload } from './category';

export type { Cart, CartRow, CartCreatePayload, CartUpdatePayload } from './cart';

export type { Order, OrderRow, OrderCreatePayload } from './order';
export type { OrderState, OrderStateCreatePayload } from './order-state';
export type { OrderHistory, OrderHistoryCreatePayload } from './order-history';

export type { Customer, CustomerCreatePayload, CustomerUpdatePayload } from './customer';
export type { Address, AddressCreatePayload, AddressUpdatePayload } from './address';

export type { Carrier, CarrierCreatePayload } from './carrier';

export type { StockAvailable, StockAvailableUpdatePayload } from './stock-available';
export type { StockMovement, StockMovementDisplay } from './stock-movement';

export type { Tax, TaxCreatePayload } from './tax';
export type { TaxRule, TaxRuleCreatePayload } from './tax-rule';
export type { TaxRuleGroup, TaxRuleGroupCreatePayload } from './tax-rule-group';

export type { ProductOption, ProductOptionCreatePayload } from './product-option';
export type { ProductOptionValue, ProductOptionValueCreatePayload } from './product-option-value';
export type { ProductFeature, ProductFeatureCreatePayload } from './product-feature';
export type { ProductFeatureValue, ProductFeatureValueCreatePayload } from './product-feature-value';

export type { Manufacturer, ManufacturerCreatePayload } from './manufacturer';
export type { Supplier, SupplierCreatePayload } from './supplier';
