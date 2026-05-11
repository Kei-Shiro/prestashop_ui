import apiService from "./api-service"
import api from '../api/client'
import type { Product } from "../types/product"

const productService = {
    async getAll(): Promise<Product[]> {
        const res: any = await apiService.get('/products?display=[id,name,price]')

        let list = res?.prestashop?.products?.product ?? []
        if (!Array.isArray(list)) list = [list]

        return list.map((p: any) => ({
            id_product: Number(p.id),
            name: Array.isArray(p.name?.language) ? p.name.language[0] : p.name?.language ?? '',
            price: p.price,
        }))

    },

    // --- Ajouts pour le FrontOffice ---

    /**
     * Récupère la liste de tous les produits (FrontOffice)
     */
    async getProducts(): Promise<Product[]> {
        const response = await api.get('/products?display=full&output_format=JSON');
        const products = response.data?.products || [];
        return products.map((p: any) => ({
            id_product: p.id,
            name: Array.isArray(p.name) ? p.name[0]?.value : p.name,
            price: p.price,
            description: Array.isArray(p.description) ? p.description[0]?.value : p.description,
            quantity: p.quantity,
            active: p.active === '1'
        }));
    },

    /**
     * Récupère les détails d'un produit spécifique
     * @param id L'identifiant du produit
     */
    async getProduct(id: number): Promise<Product> {
        const response = await api.get(`/products/${id}?output_format=JSON`);
        const p = response.data?.product;
        if (!p) throw new Error("Product not found");
        return {
            id_product: p.id,
            name: Array.isArray(p.name) ? p.name[0]?.value : p.name,
            price: p.price,
            description: Array.isArray(p.description) ? p.description[0]?.value : p.description,
            quantity: p.quantity,
            active: p.active === '1'
        };
    }

}

export default productService