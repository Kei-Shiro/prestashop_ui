// shared/services/product-service.ts
import apiService from '@shared/api/api-service';
import type { Product } from '@shared/types/product';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

const productService = {
    extractIdValue(val: any): string {
        if (val == null) return '';
        if (typeof val === 'object') {
            return String(val['#text'] || val.id || val.value || '');
        }
        return String(val);
    },

    async getAll(): Promise<Product[]> {
        const [res, stockRes] = await Promise.all([
            apiService.get<any>('/products?display=full&limit=100'),
            apiService.get<any>('/stock_availables?display=[id_product,quantity]&filter[id_product_attribute]=0')
        ]);

        let list = res?.prestashop?.products?.product ?? [];
        if (!Array.isArray(list)) list = [list];

        let stockList = stockRes?.prestashop?.stock_availables?.stock_available ?? [];
        if (!Array.isArray(stockList)) stockList = [stockList];

        const stockMap = new Map<string, string>();
        stockList.forEach((s: any) => {
            if (s && s.id_product) {
                stockMap.set(this.extractIdValue(s.id_product), String(s.quantity || '0'));
            }
        });

        // Récupérer les images pour tous les produits en parallèle
        const productsWithImages = await Promise.all(
            list.map(async (p: any) => {
                let images: string[] = [];
                if (p.associations?.images?.image) {
                    const imgAssoc = p.associations.images.image;
                    images = Array.isArray(imgAssoc) ? imgAssoc.map((i: any) => this.extractIdValue(i)) : [this.extractIdValue(imgAssoc)];
                    images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
                }
                const defaultImage = this.extractIdValue(p.id_default_image) || (images.length > 0 ? images[0] : undefined);
                
                let productCategories: string[] = [];
                if (p.associations?.categories?.category) {
                    const catAssoc = p.associations.categories.category;
                    productCategories = Array.isArray(catAssoc) 
                        ? catAssoc.map((c: any) => this.extractIdValue(c)) 
                        : [this.extractIdValue(catAssoc)];
                }

                const pid = this.extractIdValue(p.id);

                return {
                    id_product: pid,
                    name: extractLanguageValue(p.name),
                    price: parseFloat(p.price).toFixed(2),
                    description: extractLanguageValue(p.description),
                    description_short: extractLanguageValue(p.description_short),
                    quantity: stockMap.get(pid) || '0',
                    active: p.active === '1',
                    images: images,
                    id_default_image: defaultImage,
                    category: this.extractIdValue(p.id_category_default) || '2',
                    categories: productCategories,
                    date_availability: p.date_availability || '',
                    date_add: p.date_add || ''
                };
            })
        );

        return productsWithImages;
    },

    async getProduct(id: number): Promise<Product> {
        const [res, stockRes] = await Promise.all([
            apiService.get<any>(`/products/${id}?display=full`),
            apiService.get<any>(`/stock_availables?filter[id_product]=${id}&filter[id_product_attribute]=0&display=[quantity]`)
        ]);
        const p = res?.prestashop?.product;

        if (!p) throw new Error("Product not found");

        const stock = stockRes?.prestashop?.stock_availables?.stock_available;
        const quantity = Array.isArray(stock) ? stock[0]?.quantity : (stock?.quantity || '0');

        let images: string[] = [];
        if (p.associations?.images?.image) {
            const imgAssoc = p.associations.images.image;
            images = Array.isArray(imgAssoc) ? imgAssoc.map((i: any) => this.extractIdValue(i)) : [this.extractIdValue(imgAssoc)];
            images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
        }
        const defaultImage = this.extractIdValue(p.id_default_image) || (images.length > 0 ? images[0] : undefined);

        let productCategories: string[] = [];
        if (p.associations?.categories?.category) {
            const catAssoc = p.associations.categories.category;
            productCategories = Array.isArray(catAssoc) 
                ? catAssoc.map((c: any) => this.extractIdValue(c)) 
                : [this.extractIdValue(catAssoc)];
        }

        let options: { id: string }[] = [];
        if (p.associations?.product_option_values?.product_option_value) {
            const optAssoc = p.associations.product_option_values.product_option_value;
            options = Array.isArray(optAssoc) ? optAssoc.map((o: any) => ({ id: this.extractIdValue(o) })) : [{ id: this.extractIdValue(optAssoc) }];
        }

        const pid = this.extractIdValue(p.id);

        return {
            id_product: pid,
            name: extractLanguageValue(p.name),
            price: parseFloat(p.price).toFixed(2),
            description: extractLanguageValue(p.description),
            description_short: extractLanguageValue(p.description_short),
            quantity: String(quantity),
            active: p.active === '1',
            images: images,
            id_default_image: defaultImage,
            category: this.extractIdValue(p.id_category_default) || '2',
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