// Unified Domain entry point
export { useCustomerAuthStore, useAdminAuthStore, authFrontService, resetService } from './auth';
export { useCartStore, cartService } from './cart';
export { useProductStore, productService } from './product';
export { orderService } from './order';
export { customerService } from './customer';
export { categoryService } from './category';
export { taxService } from './tax';
export { useStockStore } from './stock';
export { useStatsStore, statsService } from './stats';

import { useCustomerAuthStore } from './auth';
import { useCartStore } from './cart';
import { useProductStore } from './product';
import { useStockStore } from './stock';
import { useStatsStore } from './stats';

/**
 * Global composable to access all Pinia stores from a single place
 */
export function useShop() {
    return {
        auth: useCustomerAuthStore(),
        cart: useCartStore(),
        product: useProductStore(),
        stock: useStockStore(),
        stats: useStatsStore()
    };
}
