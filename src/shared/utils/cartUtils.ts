export interface ResolvableCartItem {
    id_product: string | number;
    id_product_attribute: string | number;
    quantity: number;
}

export const DomainCartHelper = {
    /**
     * Consolide une liste de lignes d'articles en regroupant les doublons
     * de (id_product, id_product_attribute) et en additionnant leurs quantités.
     */
    consolidateItems<T extends ResolvableCartItem>(items: T[]): T[] {
        const consolidated: T[] = [];
        for (const item of items) {
            const pid = String(item.id_product);
            const attrId = String(item.id_product_attribute || '0');
            const qty = Number(item.quantity);

            const existing = consolidated.find(c => 
                String(c.id_product) === pid && 
                String(c.id_product_attribute || '0') === attrId
            );

            if (existing) {
                existing.quantity += qty;
            } else {
                consolidated.push({ ...item, quantity: qty });
            }
        }
        return consolidated;
    }
};
