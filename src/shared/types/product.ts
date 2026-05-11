// src/types/index.ts
export interface Product {
    id_product: number
    name: string
    price: string | number
    
    // Ajouts pour le FrontOffice (optionnels pour ne pas casser le BackOffice)
    description?: string;
    quantity?: number;
    imageUrl?: string;
    active?: boolean;
}

export interface ProductListResponse {
    products: Product[];
}

export interface ProductDetailResponse {
    product: Product;
}
