import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@shared/api/api-service';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { withLoading } from '@shared/utils/asyncUtils';
import taxService from './tax';
import type { Product, ProductCreatePayload } from '@shared/types/product';
import type { Combination } from '@shared/types/combination';

// Re-export canonical types for consumers
export type { Product } from '@shared/types/product';
export type { Combination } from '@shared/types/combination';

export const productService = {
    async getAll(): Promise<Product[]> {
        const [res, stockRes, taxRates] = await Promise.all([
            apiService.get<any>('/products?display=full&limit=100'),
            apiService.get<any>('/stock_availables?display=[id_product,quantity]&filter[id_product_attribute]=0'),
            taxService.getTaxRates()
        ]);

        const list = ensureArray(res?.prestashop?.products?.product);
        const stockList = ensureArray(stockRes?.prestashop?.stock_availables?.stock_available);

        const stockMap = new Map<string, string>();
        stockList.forEach((s: any) => {
            if (s && s.id_product) {
                stockMap.set(extractIdValue(s.id_product), String(s.quantity || '0'));
            }
        });

        const productsWithImages = await Promise.all(
            list.map(async (p: any): Promise<Product> => {
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

                let productOptionValues: { id: string }[] = [];
                if (p.associations?.product_option_values?.product_option_value) {
                    const optAssoc = p.associations.product_option_values.product_option_value;
                    productOptionValues = ensureArray(optAssoc).map((o: any) => ({ id: extractIdValue(o) }));
                }

                const pid = extractIdValue(p.id);
                const taxRuleGroupId = extractIdValue(p.id_tax_rules_group);
                const taxRate = taxRates.get(taxRuleGroupId) || 0;
                const priceHT = parseFloat(p.price || '0');
                const priceTTC = priceHT * (1 + taxRate / 100);

                return {
                    id_product: pid,
                    id_manufacturer: extractIdValue(p.id_manufacturer) || undefined,
                    id_supplier: extractIdValue(p.id_supplier) || undefined,
                    id_category_default: extractIdValue(p.id_category_default) || undefined,
                    id_tax_rules_group: taxRuleGroupId || undefined,
                    id_default_image: defaultImage,
                    id_default_combination: extractIdValue(p.id_default_combination) || undefined,
                    reference: p.reference || undefined,
                    ean13: p.ean13 || undefined,
                    isbn: p.isbn || undefined,
                    upc: p.upc || undefined,
                    price: priceTTC.toFixed(2),
                    wholesale_price: p.wholesale_price || undefined,
                    tax_rate: taxRate,
                    active: p.active === '1',
                    name: extractLanguageValue(p.name),
                    description: extractLanguageValue(p.description),
                    description_short: extractLanguageValue(p.description_short),
                    link_rewrite: extractLanguageValue(p.link_rewrite) || undefined,
                    quantity: stockMap.get(pid) || '0',
                    images,
                    category: extractIdValue(p.id_category_default) || '2',
                    categories: productCategories,
                    date_availability: p.available_date || '',
                    date_add: p.date_add || '',
                    date_upd: p.date_upd || '',
                    product_option_values: productOptionValues,
                    weight: p.weight || undefined,
                    condition: p.condition || undefined,
                    visibility: p.visibility || undefined,
                    minimal_quantity: p.minimal_quantity || undefined,
                    state: p.state || undefined,
                    product_type: p.product_type || undefined,
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

        if (!p) throw new Error('Product not found');

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
            id_manufacturer: extractIdValue(p.id_manufacturer) || undefined,
            id_category_default: extractIdValue(p.id_category_default) || undefined,
            id_tax_rules_group: taxRuleGroupId || undefined,
            id_default_image: defaultImage,
            reference: p.reference || undefined,
            ean13: p.ean13 || undefined,
            price: priceTTC.toFixed(2),
            wholesale_price: p.wholesale_price || undefined,
            tax_rate: taxRate,
            active: p.active === '1',
            name: extractLanguageValue(p.name),
            description: extractLanguageValue(p.description),
            description_short: extractLanguageValue(p.description_short),
            quantity: String(quantity),
            images,
            category: extractIdValue(p.id_category_default) || '2',
            categories: productCategories,
            date_availability: p.available_date || '',
            date_add: p.date_add || '',
            product_option_values: options,
            condition: p.condition || undefined,
            visibility: p.visibility || undefined,
            state: p.state || undefined,
            product_type: p.product_type || undefined,
        };
    },

    async getCategories(): Promise<{ id: string; name: string }[]> {
        const list = await apiService.fetchList<any>('/categories?display=full', 'categories', 'category');
        return list.map((c: any) => ({
            id: String(c.id),
            name: extractLanguageValue(c.name)
        }));
    },

    async getCombinations(productId: number): Promise<Combination[]> {
        try {
            const raw = await apiService.fetchList<any>(
                `/combinations?filter[id_product]=${productId}&display=full`,
                'combinations',
                'combination'
            );
            return raw.map((c: any): Combination => ({
                id: extractIdValue(c.id),
                id_product: extractIdValue(c.id_product),
                reference: c.reference || undefined,
                price: c.price || undefined,
                wholesale_price: c.wholesale_price || undefined,
                ean13: c.ean13 || undefined,
                default_on: c.default_on || undefined,
                available_date: c.available_date || undefined,
                associations: c.associations,
            }));
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
            console.error(`Erreur lors de la récupération des images pour le produit ${id}:`, error);
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

    async checkStock(
        productId: string | number,
        attributeId: string | number,
        requiredQty: number
    ): Promise<{ available: boolean; currentStock: number }> {
        try {
            let stockQty = 0;
            if (Number(attributeId) > 0) {
                const stockStr = await this.getCombinationStock(Number(attributeId));
                stockQty = Number(stockStr);
            } else {
                const prod = await this.getProduct(Number(productId));
                stockQty = Number(prod.quantity);
            }
            return { available: stockQty >= requiredQty, currentStock: stockQty };
        } catch (err) {
            console.warn(`[ProductModel] Stock check failed for product ${productId}:`, err);
            return { available: false, currentStock: 0 };
        }
    },

    /** POST a new product to the PS API. */
    async create(payload: ProductCreatePayload): Promise<string> {
        const response = await apiService.post<any>('/products', { product: payload });
        return extractIdValue(response.prestashop.product.id);
    },
};

export const useProductStore = defineStore('product', () => {
    const products = ref<Product[]>([]);
    const loading = ref(false);

    async function fetchProducts() {
        await withLoading(loading, async () => {
            products.value = await productService.getAll();
        });
    }

    return { products, loading, fetchProducts };
});

export default productService;
