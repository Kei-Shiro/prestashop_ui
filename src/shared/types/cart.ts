// shared/types/cart.ts
import type { Product } from './product';

export interface Cart {
    items: CartItem[];
    total_quantity: number;
    total_price: number;
}

export interface CartItem {
    product: Product;
    quantity: number;
    unit_price: number;
    total_price: number;
    id_product_attribute?: string;
}