// shared/services/product-service.ts
import apiService from './api-service';
import type { Product } from '../types/product';

const productService = {
    async getAll(): Promise<Product[]> {
        const res = await apiService.get<any>('/products?display=full&limit=100');

        let list = res?.prestashop?.products?.product ?? [];
        if (!Array.isArray(list)) list = [list];

        // Récupérer les images pour tous les produits en parallèle
        const productsWithImages = await Promise.all(
            list.map(async (p: any) => {
                const images = await productService.getImageIds(p.id);
                return {
                    id_product: String(p.id),
                    name: productService.extractLanguageValue(p.name),
                    price: parseFloat(p.price).toFixed(2),
                    description: productService.extractLanguageValue(p.description),
                    description_short: productService.extractLanguageValue(p.description_short),
                    quantity: p.quantity || '0',
                    active: p.active === '1',
                    images: images,
                    id_default_image: images.length > 0 ? images[0] : undefined,
                    category: p.id_category_default || 'Vêtements'
                };
            })
        );

        return productsWithImages;
    },

    async getProduct(id: number): Promise<Product> {
        const res = await apiService.get<any>(`/products/${id}?display=full`);
        const p = res?.prestashop?.product;

        if (!p) throw new Error("Product not found");

        const images = await productService.getImageIds(id);

        return {
            id_product: String(p.id),
            name: productService.extractLanguageValue(p.name),
            price: parseFloat(p.price).toFixed(2),
            description: productService.extractLanguageValue(p.description),
            description_short: productService.extractLanguageValue(p.description_short),
            quantity: p.quantity || '0',
            active: p.active === '1',
            images: images,
            id_default_image: images.length > 0 ? images[0] : undefined,
            category: p.id_category_default || 'Vêtements'
        };
    },

    /**
     * Extrait la valeur d'un champ multilingue (name, description, etc.)
     */
    extractLanguageValue(field: any): string {
        if (!field) return '';
        if (typeof field === 'string') return field;

        // Si c'est un objet avec language
        if (field.language) {
            const lang = field.language;
            if (Array.isArray(lang)) {
                // Prendre la première langue (français)
                return lang[0]?.value || lang[0]?.textContent || '';
            }
            return lang.value || lang.textContent || '';
        }

        // Si c'est directement la valeur
        if (field.value) return field.value;
        if (field.textContent) return field.textContent;

        return '';
    },

    async getImageIds(id: number): Promise<string[]> {
        try {
            const res = await apiService.get<any>(`/images/products/${id}`);
            const images = res?.prestashop?.images?.image ?? [];
            return Array.isArray(images) ? images.map((img: any) => String(img.id)) : [String(images.id)];
        } catch (error) {
            console.error(`Erreur lors de la récupération des images pour le produit ${id}:`, error);
            return [];
        }
    },

    getImageUrl(productId: string | number, imageId?: string | number, format: string = 'large_default'): string {
        if (imageId && imageId !== '0') {
            return `/prestashop/api/images/products/${productId}/${imageId}/${format}.jpg`;
        }
        return `/prestashop/api/images/products/${productId}/${format}.jpg`;
    }
};

export default productService;