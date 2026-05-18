import apiService from '@shared/api/api-service';
import type { Product } from '@shared/types/product';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import taxService from './tax-service';

const productService = {
    async getAll(): Promise<Product[]> {
        const [res, stockRes, taxRates] = await Promise.all([
            apiService.get<any>('/products?display=full&limit=100'),
            apiService.get<any>('/stock_availables?display=[id_product,quantity]&filter[id_product_attribute]=0'),
            taxService.getTaxRates()
        ]);

        let list = ensureArray(res?.prestashop?.products?.product);
        let stockList = ensureArray(stockRes?.prestashop?.stock_availables?.stock_available);

        const stockMap = new Map<string, string>();
        stockList.forEach((s: any) => {
            if (s && s.id_product) {
                stockMap.set(extractIdValue(s.id_product), String(s.quantity || '0'));
            }
        });

        // Récupérer les images pour tous les produits en parallèle
        const productsWithImages = await Promise.all(
            list.map(async (p: any) => {
                let images: string[] = [];
                if (p.associations?.images?.image) {
                    const imgAssoc = p.associations.images.image;
                    images = ensureArray(imgAssoc).map((i: any) => extractIdValue(i));
                    images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
                }
                const defaultImage = extractIdValue(p.id_default_image) || (images.length > 0 ? images[0] : undefined);
                
                let productCategories: string[] = [];
                if (p.associations?.categories?.category) {
                    const catAssoc = p.associations.categories.category;
                    productCategories = ensureArray(catAssoc).map((c: any) => extractIdValue(c));
                }

                const pid = extractIdValue(p.id);
                const taxRuleGroupId = extractIdValue(p.id_tax_rules_group);
                const taxRate = taxRates.get(taxRuleGroupId) || 0;
                const priceHT = parseFloat(p.price || '0');
                const priceTTC = priceHT * (1 + taxRate / 100);

                return {
                    id_product: pid,
                    name: extractLanguageValue(p.name),
                    price: priceTTC.toFixed(2),
                    tax_rate: taxRate,
                    description: extractLanguageValue(p.description),
                    description_short: extractLanguageValue(p.description_short),
                    quantity: stockMap.get(pid) || '0',
                    active: p.active === '1',
                    images: images,
                    id_default_image: defaultImage,
                    category: extractIdValue(p.id_category_default) || '2',
                    categories: productCategories,
                    date_availability: p.available_date || '',
                    date_add: p.date_add || ''
                };
            })
        );

        return productsWithImages;
    },

    async getProduct(id: number): Promise<Product> {
        const [res, stockRes, taxRates] = await Promise.all([
            apiService.get<any>(`/products/${id}?display=full`),
            apiService.get<any>(`/stock_availables?filter[id_product]=${id}&filter[id_product_attribute]=0&display=[quantity]`),
            taxService.getTaxRates()
        ]);
        const p = res?.prestashop?.product;

        if (!p) throw new Error("Product not found");

        const stock = stockRes?.prestashop?.stock_availables?.stock_available;
        const quantity = ensureArray(stock)[0]?.quantity || '0';

        let images: string[] = [];
        if (p.associations?.images?.image) {
            const imgAssoc = p.associations.images.image;
            images = ensureArray(imgAssoc).map((i: any) => extractIdValue(i));
            images = images.filter((i: string) => i && i !== 'undefined' && i !== '0');
        }
        const defaultImage = extractIdValue(p.id_default_image) || (images.length > 0 ? images[0] : undefined);

        let productCategories: string[] = [];
        if (p.associations?.categories?.category) {
            const catAssoc = p.associations.categories.category;
            productCategories = ensureArray(catAssoc).map((c: any) => extractIdValue(c));
        }

        let options: { id: string }[] = [];
        if (p.associations?.product_option_values?.product_option_value) {
            const optAssoc = p.associations.product_option_values.product_option_value;
            options = ensureArray(optAssoc).map((o: any) => ({ id: extractIdValue(o) }));
        }

        const pid = extractIdValue(p.id);
        const taxRuleGroupId = extractIdValue(p.id_tax_rules_group);
        const taxRate = taxRates.get(taxRuleGroupId) || 0;
        const priceHT = parseFloat(p.price || '0');
        const priceTTC = priceHT * (1 + taxRate / 100);

        return {
            id_product: pid,
            name: extractLanguageValue(p.name),
            price: priceTTC.toFixed(2),
            tax_rate: taxRate,
            description: extractLanguageValue(p.description),
            description_short: extractLanguageValue(p.description_short),
            quantity: String(quantity),
            active: p.active === '1',
            images: images,
            id_default_image: defaultImage,
            category: extractIdValue(p.id_category_default) || '2',
            date_availability: p.date_availability || '',
            date_add: p.date_add || '',
            product_option_values: options
        };
    },


    async getCategories(): Promise<{ id: string, name: string }[]> {
        const list = await apiService.fetchList<any>('/categories?display=full', 'categories', 'category');
        return list.map((c: any) => ({
            id: String(c.id),
            name: extractLanguageValue(c.name)
        }));
    },

    async getCombinations(productId: number): Promise<any[]> {
        try {
            return await apiService.fetchList<any>(`/combinations?filter[id_product]=${productId}&display=full`, 'combinations', 'combination');
        } catch (error) {
            console.error(`Error fetching combinations for product ${productId}:`, error);
            return [];
        }
    },

    async getCombinationStock(combinationId: number): Promise<string> {
        try {
            const res = await apiService.get<any>(`/stock_availables?filter[id_product_attribute]=${combinationId}&display=[quantity]`);
            const stock = res?.prestashop?.stock_availables?.stock_available;
            return String(ensureArray(stock)[0]?.quantity || '0');
        } catch (error) {
            console.error(`Error fetching stock for combination ${combinationId}:`, error);
            return '0';
        }
    },

    async getProductOptionValues(): Promise<any[]> {
        return await apiService.fetchList<any>('/product_option_values?display=full', 'product_option_values', 'product_option_value');
    },

    async getProductOptions(): Promise<any[]> {
        return await apiService.fetchList<any>('/product_options?display=full', 'product_options', 'product_option');
    },

    extractLanguageValue(field: any): string {
        return extractLanguageValue(field);
    },

    extractIdValue(val: any): string {
        return extractIdValue(val);
    },

    async getImageIds(id: number): Promise<string[]> {
        try {
            const res = await apiService.get<any>(`/images/products/${id}`);
            const images = ensureArray(res?.prestashop?.images?.image);
            return images.map((img: any) => String(img.id));
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
    },



};

export default productService;