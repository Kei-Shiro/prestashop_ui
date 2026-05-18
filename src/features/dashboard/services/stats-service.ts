import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';

export const statsService = {
    /**
     * Calcule le CA, le coût d'achat, et le bénéfice par catégorie.
     * Prend en compte les prix spécifiques aux déclinaisons (combinations)
     * et les prix de vente réels des commandes.
     */
    async getProfitByCategoryReport() {
        // 1. Récupération de toutes les données nécessaires en parallèle pour la performance
        const [ordersRes, productsRes, combinationsRes, categoriesRes] = await Promise.all([
            // Commandes valides pour le prix de vente final (unit_price_tax_excl)
            apiService.get<any>('/orders?display=full&filter[valid]=1'),
            // Produits pour le prix d'achat par défaut (wholesale_price) et la catégorie
            apiService.get<any>('/products?display=[id,wholesale_price,id_category_default]'),
            // Déclinaisons pour le prix d'achat spécifique à une taille/couleur
            apiService.get<any>('/combinations?display=[id,id_product,wholesale_price]'),
            // Catégories pour récupérer le nom au lieu d'afficher juste un ID
            apiService.get<any>('/categories?filter[id]=![1|2]&display=[id,name]')
        ]);

        const ordersRaw = ordersRes?.prestashop?.orders?.order;
        const productsRaw = productsRes?.prestashop?.products?.product;
        const combinationsRaw = combinationsRes?.prestashop?.combinations?.combination;
        const categoriesRaw = categoriesRes?.prestashop?.categories?.category;

        const orders = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw ? [ordersRaw] : []);
        const products = Array.isArray(productsRaw) ? productsRaw : (productsRaw ? [productsRaw] : []);
        const combinations = Array.isArray(combinationsRaw) ? combinationsRaw : (combinationsRaw ? [combinationsRaw] : []);
        const categories = Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw ? [categoriesRaw] : []);

        // 2. Création d'un dictionnaire ID Catégorie -> Nom Catégorie
        const categoryMap = new Map<string, string>();
        categories.forEach((c: any) => {
            categoryMap.set(extractIdValue(c.id), extractLanguageValue(c.name) || 'Inconnue');
        });

        // 3. Création d'un dictionnaire ID Déclinaison -> Prix d'achat spécifique
        const combinationMap = new Map<string, number>();
        combinations.forEach((c: any) => {
            const price = parseFloat(c.wholesale_price || '0');
            combinationMap.set(extractIdValue(c.id), price);
        });

        // 4. Création d'un dictionnaire Produit -> { Prix d'achat par défaut, ID Catégorie }
        const productCatalog = new Map<string, { purchasePrice: number, categoryId: string }>();
        products.forEach((p: any) => {
            productCatalog.set(extractIdValue(p.id), {
                purchasePrice: parseFloat(p.wholesale_price || '0'),
                categoryId: extractIdValue(p.id_category_default) || '0'
            });
        });

        // 5. Initialisation et Agrégation des ventes et coûts
        const categoryStats = new Map<string, { name: string, sales: number, purchases: number, profit: number }>();

        // On initialise d'abord TOUTES les catégories à 0 pour qu'elles apparaissent même sans vente
        categoryMap.forEach((name, categoryId) => {
            // On peut exclure la catégorie racine "Root" (ID 1) si elle parasite le tableau
            if (categoryId !== '1') {
                categoryStats.set(categoryId, { name, sales: 0, purchases: 0, profit: 0 });
            }
        });

        orders.forEach((order: any) => {
            const rowsRaw = order.associations?.order_rows?.order_row;
            if (!rowsRaw) return;

            const rows = Array.isArray(rowsRaw) ? rowsRaw : [rowsRaw];

            rows.forEach((row: any) => {
                const productId = extractIdValue(row.product_id);
                const attributeId = extractIdValue(row.product_attribute_id);
                const quantity = parseInt(row.product_quantity || '1', 10);

                // VENTE : On prend le prix de vente (HT) exactement tel qu'il a été facturé dans la commande
                const unitPrice = parseFloat(row.unit_price_tax_excl || '0');

                const pInfo = productCatalog.get(productId);
                if (!pInfo) return; // Produit n'existe plus dans le catalogue

                const categoryId = pInfo.categoryId;

                // ACHAT : Détermination du coût
                // Si l'attribut (déclinaison) a un coût d'achat défini, il remplace le coût par défaut du produit
                let costPrice = pInfo.purchasePrice;
                if (attributeId && attributeId !== '0') {
                    const comboCost = combinationMap.get(attributeId);
                    if (comboCost && comboCost > 0) {
                        costPrice = comboCost;
                    }
                }

                // Calculs finaux pour la ligne
                const revenue = unitPrice * quantity;
                const cost = costPrice * quantity;
                const profit = revenue - cost;

                // Ajout dans notre structure
                if (!categoryStats.has(categoryId)) {
                    categoryStats.set(categoryId, {
                        name: categoryMap.get(categoryId) || `Catégorie ${categoryId}`,
                        sales: 0,
                        purchases: 0,
                        profit: 0
                    });
                }

                const stats = categoryStats.get(categoryId)!;
                stats.sales += revenue;
                stats.purchases += cost;
                stats.profit += profit;
            });
        });

        // 6. On retourne un tableau simple trié par le plus gros bénéfice
        return Array.from(categoryStats.values()).sort((a, b) => b.profit - a.profit);
    },

    /**
     * Calcule la quantité physique, réservée, et disponible par catégorie.
     */
    async getStockByCategoryReport() {
        const [productsRes, stockRes, categoriesRes, ordersRes] = await Promise.all([
            apiService.get<any>('/products?display=[id,id_category_default]'),
            apiService.get<any>('/stock_availables?display=full'),
            apiService.get<any>('/categories?filter[id]=![1|2]&display=[id,name]'),
            // On récupère les commandes valides pour calculer nous-mêmes le stock réservé
            apiService.get<any>('/orders?display=full&filter[valid]=1')
        ]);

        const productsRaw = productsRes?.prestashop?.products?.product;
        const stockRaw = stockRes?.prestashop?.stock_availables?.stock_available;
        const categoriesRaw = categoriesRes?.prestashop?.categories?.category;
        const ordersRaw = ordersRes?.prestashop?.orders?.order;

        const products = Array.isArray(productsRaw) ? productsRaw : (productsRaw ? [productsRaw] : []);
        const stocks = Array.isArray(stockRaw) ? stockRaw : (stockRaw ? [stockRaw] : []);
        const categories = Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw ? [categoriesRaw] : []);
        const orders = Array.isArray(ordersRaw) ? ordersRaw : (ordersRaw ? [ordersRaw] : []);

        const categoryMap = new Map<string, string>();
        categories.forEach((c: any) => {
            categoryMap.set(extractIdValue(c.id), extractLanguageValue(c.name) || 'Inconnue');
        });

        const productToCategory = new Map<string, string>();
        products.forEach((p: any) => {
            productToCategory.set(extractIdValue(p.id), extractIdValue(p.id_category_default) || '0');
        });

        const categoryStocks = new Map<string, { name: string, physical: number, reserved: number, available: number }>();
        
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
            if (stateId === '2' || stateId === '3') {
                const rowsRaw = order.associations?.order_rows?.order_row;
                const rows = Array.isArray(rowsRaw) ? rowsRaw : (rowsRaw ? [rowsRaw] : []);
                
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
