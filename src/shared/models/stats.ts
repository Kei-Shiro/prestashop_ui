import { defineStore } from 'pinia';
import { ref } from 'vue';
import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import { withLoading } from '@shared/utils/asyncUtils';

export interface CategoryProfitStat {
    name: string;
    sales: number;
    purchases: number;
    profit: number;
    globalPurchases: number;

    globalProfit: number;
}

export interface CategoryStockStat {
    name: string;
    physical: number;
    reserved: number;
    available: number;
}

export const statsService = {
    /**
     * Calcule le CA, le coût d'achat, et le bénéfice par catégorie.
     * Prend en compte les prix spécifiques aux déclinaisons (combinations)
     * et les prix de vente réels des commandes.
     */
    async getProfitByCategoryReport(): Promise<CategoryProfitStat[]> {
        // 1. Récupération de toutes les données nécessaires en parallèle pour la performance
        const [ordersRes, productsRes, combinationsRes, categoriesRes, movementsRes, stockAvailablesRes] = await Promise.all([
            // Commandes valides pour le prix de vente final (unit_price_tax_excl)
            apiService.get<any>('/orders?display=full&filter[valid]=1'),
            // Produits pour le prix d'achat par défaut (wholesale_price) et la catégorie
            apiService.get<any>('/products?display=[id,wholesale_price,id_category_default]'),
            // Déclinaisons pour le prix d'achat spécifique à une taille/couleur
            apiService.get<any>('/combinations?display=[id,id_product,wholesale_price]'),
            // Catégories pour récupérer le nom au lieu d'afficher juste un ID
            apiService.get<any>('/categories?filter[id]=![1|2]&display=[id,name]'),
            // Mouvements de stock pour calculer l'achat global (entrées uniquement, limitant le payload)
            apiService.get<any>('/stock_movements?display=[id,id_stock,id_product,id_product_attribute,sign,physical_quantity,price_te]'),
            // Stock availables pour faire le lien entre id_stock et id_product (car le mvt pointe vers stock_available)
            apiService.get<any>('/stock_availables?display=[id,id_product,id_product_attribute]')
        ]);

        // Les données XML brutes sont converties en tableaux sûrs pour l'itération
        const orders = ensureArray(ordersRes?.prestashop?.orders?.order);
        const products = ensureArray(productsRes?.prestashop?.products?.product);
        const combinations = ensureArray(combinationsRes?.prestashop?.combinations?.combination);
        const categories = ensureArray(categoriesRes?.prestashop?.categories?.category);
        const movements = ensureArray(movementsRes?.prestashop?.stock_mvts?.stock_mvt);
        const stockAvailables = ensureArray(stockAvailablesRes?.prestashop?.stock_availables?.stock_available);

        // Map des catégories pour associer rapidement un ID à son nom lisible
        const categoryMap = new Map<string, string>();
        categories.forEach((c: any) => categoryMap.set(extractIdValue(c.id), extractLanguageValue(c.name) || 'Inconnue'));

        // Map des stocks pour lier id_stock -> {productId, attributeId}
        const stockMapping = new Map<string, { productId: string, attributeId: string }>();
        stockAvailables.forEach((s: any) => {
            stockMapping.set(extractIdValue(s.id), {
                productId: extractIdValue(s.id_product),
                attributeId: extractIdValue(s.id_product_attribute)
            });
        });

        // Map des déclinaisons pour retrouver le coût d'achat spécifique si différent du produit parent
        const combinationMap = new Map<string, number>();
        combinations.forEach((c: any) => {
            const comboId = extractIdValue(c.id);
            combinationMap.set(comboId, parseFloat(c.wholesale_price || '0'));
        });

        // Map du catalogue pour lier chaque produit à sa catégorie et son coût par défaut
        const productCatalog = new Map<string, { purchasePrice: number, categoryId: string }>();
        products.forEach((p: any) => productCatalog.set(extractIdValue(p.id), {
            purchasePrice: parseFloat(p.wholesale_price || '0'),
            categoryId: extractIdValue(p.id_category_default) || '0'
        }));

        // 5. Initialisation et Agrégation des ventes et coûts
        const categoryStats = new Map<string, CategoryProfitStat>();

        // On initialise d'abord TOUTES les catégories à 0 pour qu'elles apparaissent même sans vente
        categoryMap.forEach((name, categoryId) => {
            if (categoryId !== '1') {
                categoryStats.set(categoryId, { name, sales: 0, purchases: 0, profit: 0, globalPurchases: 0, globalProfit: 0 });
            }
        });

        // VENTES ET COUTS DES VENTES
        orders.forEach((order: any) => {
            const stateId = extractIdValue(order.current_state);
            // On exclut les commandes annulées, remboursées ou en erreur
            if (stateId === '6' || stateId === '7' || stateId === '8') return;

            const rowsRaw = order.associations?.order_rows?.order_row;
            if (!rowsRaw) return;

            const rows = ensureArray(rowsRaw);
            rows.forEach((row: any) => {
                const productId = extractIdValue(row.product_id);
                const attributeId = extractIdValue(row.product_attribute_id);
                const quantity = parseInt(row.product_quantity || '1', 10);
                const unitPrice = parseFloat(row.unit_price_tax_excl || '0');

                const pInfo = productCatalog.get(productId);
                if (!pInfo) return;

                const categoryId = pInfo.categoryId;

                let costPrice = pInfo.purchasePrice;
                if (attributeId && attributeId !== '0') {
                    const comboCost = combinationMap.get(attributeId);
                    if (comboCost && comboCost > 0) costPrice = comboCost;
                }

                const revenue = unitPrice * quantity;
                const cost = costPrice * quantity;
                const profit = revenue - cost;

                const stats = categoryStats.get(categoryId);
                if (stats) {
                    stats.sales += revenue;
                    stats.purchases += cost;
                    stats.profit += profit;
                }
            });
        });

        // ACHAT GLOBAL : Basé sur les mouvements d'entrée (sign = 1)
        movements.forEach((m: any) => {
            const rawSign = extractIdValue(m.sign);
            const sign = parseInt(rawSign, 10);
            
            if (sign !== 1) return; // On ne prend que les entrées (achat/réappro)

            const stockId = extractIdValue(m.id_stock);
            
            // Résolution des IDs (PrestaShop laisse parfois id_product vide dans le mouvement)
            let productId = extractIdValue(m.id_product);
            let attributeId = extractIdValue(m.id_product_attribute);

            if (!productId || productId === '') {
                const mapping = stockMapping.get(stockId);
                if (mapping) {
                    productId = mapping.productId;
                    attributeId = mapping.attributeId;
                }
            }

            if (!productId) {
                console.warn(`[Stats] Movement skipped: No productId resolved for stockId ${stockId}`);
                return;
            }

            const quantity = Math.abs(parseInt(extractIdValue(m.physical_quantity) || '0', 10));

            // On essaie de récupérer le prix d'achat directement du mouvement (price_te)
            // Sinon on se rabat sur le catalogue
            let costPrice = parseFloat(extractIdValue(m.price_te) || '0');

            const pInfo = productCatalog.get(productId);
            if (costPrice <= 0) {
                if (pInfo) {
                    costPrice = pInfo.purchasePrice;
                    if (attributeId && attributeId !== '0') {
                        const comboCost = combinationMap.get(attributeId);
                        if (comboCost && comboCost > 0) costPrice = comboCost;
                    }
                }
            }

            const categoryId = pInfo?.categoryId || '0';

            const cost = costPrice * quantity;
            const stats = categoryStats.get(categoryId);
            if (stats) {
                stats.globalPurchases += cost;
            }
        });

        // Calcul du bénéfice global
        categoryStats.forEach(stat => {
            stat.globalProfit = stat.sales - stat.globalPurchases;
        });

        // 6. On retourne un tableau simple trié par le plus gros bénéfice (ventes)
        return Array.from(categoryStats.values()).sort((a, b) => b.profit - a.profit);
    },

    /**
     * Calcule la quantité physique, réservée, et disponible par catégorie.
     */
    async getStockByCategoryReport(): Promise<CategoryStockStat[]> {
        const [productsRes, stockRes, categoriesRes, ordersRes] = await Promise.all([
            apiService.get<any>('/products?display=[id,id_category_default]'),
            apiService.get<any>('/stock_availables?display=[id,id_product,id_product_attribute,quantity]'),
            apiService.get<any>('/categories?filter[id]=![1|2]&display=[id,name]'),
            // Récupère uniquement les commandes en cours de traitement sur le serveur (2=payé, 3=préparation, 11=attente)
            apiService.get<any>('/orders?filter[current_state]=[2|3|11]&display=full')
        ]);

        const products = ensureArray(productsRes?.prestashop?.products?.product);
        const stocks = ensureArray(stockRes?.prestashop?.stock_availables?.stock_available);
        const categories = ensureArray(categoriesRes?.prestashop?.categories?.category);
        const orders = ensureArray(ordersRes?.prestashop?.orders?.order);

        // Pré-calcul des associations pour éviter les requêtes imbriquées (Performance)
        const categoryMap = new Map<string, string>();
        const productToCategory = new Map<string, string>();
        categories.forEach((c: any) => categoryMap.set(extractIdValue(c.id), extractLanguageValue(c.name) || 'Inconnue'));
        products.forEach((p: any) => productToCategory.set(extractIdValue(p.id), extractIdValue(p.id_category_default) || '0'));

        const categoryStocks = new Map<string, CategoryStockStat>();
        
        categoryMap.forEach((name, categoryId) => {
            categoryStocks.set(categoryId, { name, physical: 0, reserved: 0, available: 0 });
        });

        // 1. Calcul des stocks disponibles (d'après l'API stock_availables)
        stocks.forEach((s: any) => {
            const attributeId = extractIdValue(s.id_product_attribute);
            if (attributeId !== '0' && attributeId !== undefined) return;

            const productId = extractIdValue(s.id_product);
            const categoryId = productToCategory.get(productId);
            if (!categoryId || !categoryStocks.has(categoryId)) return;

            const quantity = parseInt(s.quantity || '0', 10);
            categoryStocks.get(categoryId)!.available += quantity;
        });

        // 2. Calcul manuel des stocks "réservés" (Commandes payées mais pas encore expédiées)
        // Les statuts PrestaShop classiques : 2 (Paiement accepté), 3 (En cours de préparation)
        // Les statuts expédiés/livrés sont généralement 4 et 5.
        orders.forEach((order: any) => {
            const stateId = extractIdValue(order.current_state);
            // Si la commande est validée mais pas encore expédiée (statuts 4, 5 sont expédié/livré)
            if (stateId === '2' || stateId === '3' || stateId === '11') {
                const rowsRaw = order.associations?.order_rows?.order_row;
                const rows = ensureArray(rowsRaw);
                
                rows.forEach((row: any) => {
                    const productId = extractIdValue(row.product_id);
                    const categoryId = productToCategory.get(productId);
                    if (!categoryId || !categoryStocks.has(categoryId)) return;

                    const qty = parseInt(row.product_quantity || '0', 10);
                    categoryStocks.get(categoryId)!.reserved += qty;
                });
            }
        });

        // 3. Déduction de la quantité physique (Disponible + Réservée)
        categoryStocks.forEach((stat) => {
            stat.physical = stat.available + stat.reserved;
        });

        return Array.from(categoryStocks.values()).sort((a, b) => b.physical - a.physical);
    }
};

export const useStatsStore = defineStore('stats', () => {
    const categoryStats = ref<CategoryProfitStat[]>([]);
    const isLoading = ref(false);

    const categoryStocks = ref<CategoryStockStat[]>([]);
    const isStockLoading = ref(false);

    const fetchStats = () => withLoading(isLoading, async () => {
        categoryStats.value = await statsService.getProfitByCategoryReport();
    }, undefined, "Erreur lors du calcul des bénéfices");

    const fetchStocks = () => withLoading(isStockLoading, async () => {
        categoryStocks.value = await statsService.getStockByCategoryReport();
    }, undefined, "Erreur lors du calcul des stocks");

    return { categoryStats, isLoading, fetchStats, categoryStocks, isStockLoading, fetchStocks };
});

export default statsService;
