// shared/types/product.ts
export interface Product {
    id_product: string;
    name: string;
    price: string;
    description: string;
    description_short?: string;
    quantity: string;
    active: boolean;
    images?: string[];
    id_default_image?: string;
    category?: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
    total_price: number;
}