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
    date_availability?: string;
    date_add?: string;
    product_option_values?: { id: string }[];
}

