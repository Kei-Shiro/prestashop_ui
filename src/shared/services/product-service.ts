// shared/services/product-service.ts
import apiService from './api-service';
import type { Product } from '../types/product';
import { extractLanguageValue } from '../utils/extractLanguageValue';

const productService = {
    async getAll(): Promise<Product[]> {
        const res = await apiService.get<any>('/products?display=full&limit=100');

        let list = res?.prestashop?.products?.product ?? [];
        if (!Array.isArray(list)) list = [list];

        // RǸcupǸrer les images pour tous les produits en parallle
        const productsWithImages = await Promise.all(
            list.map(async (p: any) => {
                let images: string[] = [];
                if (p.associations?.images?.image) {
                    const imgAssoc = p.associations.images.image;
                    images = Array.isArray(imgAssoc) ? imgAssoc.map((i: any) => String(i.id || i['#text'] || i.value || '')) : [String(imgAssoc.id || imgAssoc['#text'] || imgAssoc.value || '')];
                    images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
                }
                const defaultImage = p.id_default_image || (images.length > 0 ? images[0] : undefined);
                
                return {
                    id_product: String(p.id),
name: extractLanguageValue(p.name),
                    price: parseFloat(p.price).toFixed(2),
                    description: extractLanguageValue(p.description),
                    description_short: extractLanguageValue(p.description_short),
                    quantity: p.quantity || '0',
                    active: p.active === '1',
                    images: images,
                    id_default_image: defaultImage,
                    category: p.id_category_default || '3',
                    date_availability: p.date_availability || '',
                    date_add: p.date_add || ''
                };
            })
        );

        return productsWithImages;
    },

    async getProduct(id: number): Promise<Product> {
        const res = await apiService.get<any>(`/products/${id}?display=full`);
        const p = res?.prestashop?.product;

        if (!p) throw new Error("Product not found");

        let images: string[] = [];
        if (p.associations?.images?.image) {
            const imgAssoc = p.associations.images.image;
            images = Array.isArray(imgAssoc) ? imgAssoc.map((i: any) => String(i.id || i['#text'] || i.value || '')) : [String(imgAssoc.id || imgAssoc['#text'] || imgAssoc.value || '')];
            images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
        }
        const defaultImage = p.id_default_image || (images.length > 0 ? images[0] : undefined);

        let options: { id: string }[] = [];
        if (p.associations?.product_option_values?.product_option_value) {
            const optAssoc = p.associations.product_option_values.product_option_value;
            options = Array.isArray(optAssoc) ? optAssoc.map((o: any) => ({ id: String(o.id) })) : [{ id: String(optAssoc.id) }];
        }

        return {
            id_product: String(p.id),
            name: extractLanguageValue(p.name),
            price: parseFloat(p.price).toFixed(2),
            description: extractLanguageValue(p.description),
            description_short: extractLanguageValue(p.description_short),
            quantity: p.quantity || '0',
            active: p.active === '1',
            images: images,
            id_default_image: defaultImage,
            category: p.id_category_default || '3',
            date_availability: p.date_availability || '',
            date_add: p.date_add || '',
            product_option_values: options
        };
    },

    async getCategories(): Promise<{ id: string, name: string }[]> {
        const res = await apiService.get<any>('/categories?display=full');
        let list = res?.prestashop?.categories?.category ?? [];
        if (!Array.isArray(list)) list = [list];
        return list.map((c: any) => ({
            id: String(c.id),
            name: extractLanguageValue(c.name)
        }));
    },

    async getProductOptionValues(): Promise<any[]> {
        const res = await apiService.get<any>('/product_option_values?display=full');
        let list = res?.prestashop?.product_option_values?.product_option_value ?? [];
        if (!Array.isArray(list)) list = [list];
        return list;
    },

    async getProductOptions(): Promise<any[]> {
        const res = await apiService.get<any>('/product_options?display=full');
        let list = res?.prestashop?.product_options?.product_option ?? [];
        if (!Array.isArray(list)) list = [list];
        return list;
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
                // Prendre la premire langue (franais)
                const l = lang[0];
                return typeof l === 'string' ? l : (l?.value || l?.textContent || '');
            }
            return typeof lang === 'string' ? lang : (lang.value || lang.textContent || '');
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
            console.error(`Erreur lors de la rǸcupǸration des images pour le produit ${id}:`, error);
            return [];
        }
    },

    getImageUrl(productId: string | number, imageId?: string | number): string {
        const apiKey = import.meta.env.VITE_PS_API_KEY || '';
        const urlParams = apiKey ? `?ws_key=${apiKey}` : '';
        if (imageId && imageId !== '0') {
            return `/prestashop/api/images/products/${productId}/${imageId}${urlParams}`;
        }
        return `/prestashop/api/images/products/${productId}/${urlParams}`;
    }


};

export default productService;