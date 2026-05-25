/**
 * Service de Domaine pour les calculs de prix et de taxes.
 * Encapsule les formules financières du commerce.
 */
export const DomainPriceService = {
    /**
     * Calcule le prix TTC à partir du prix HT et du taux de taxe.
     * Formule : HT * (1 + rate / 100)
     */
    calculateTTC(priceHT: number | string, taxRatePercent: number | string): number {
        const ht = typeof priceHT === 'string' ? parseFloat(priceHT || '0') : priceHT;
        const rate = typeof taxRatePercent === 'string' ? parseFloat(taxRatePercent || '0') : taxRatePercent;
        return ht * (1 + rate / 100);
    },

    /**
     * Calcule le prix HT à partir du prix TTC et du taux de taxe.
     * Formule : TTC / (1 + rate / 100)
     */
    calculateHT(priceTTC: number | string, taxRatePercent: number | string): number {
        const ttc = typeof priceTTC === 'string' ? parseFloat(priceTTC || '0') : priceTTC;
        const rate = typeof taxRatePercent === 'string' ? parseFloat(taxRatePercent || '0') : taxRatePercent;
        return ttc / (1 + rate / 100);
    },

    /**
     * Calcule l'impact HT d'une déclinaison à partir de son prix de vente TTC souhaité
     * et du prix de vente TTC du produit de base.
     * Formule : (combinationTTC - productTTC) / (1 + rate / 100)
     */
    calculateCombinationImpactHT(
        combinationTTC: number | string,
        productTTC: number | string,
        taxRatePercent: number | string
    ): number {
        const comboTtc = typeof combinationTTC === 'string' ? parseFloat(combinationTTC || '0') : combinationTTC;
        const prodTtc = typeof productTTC === 'string' ? parseFloat(productTTC || '0') : productTTC;
        const rate = typeof taxRatePercent === 'string' ? parseFloat(taxRatePercent || '0') : taxRatePercent;
        return (comboTtc - prodTtc) / (1 + rate / 100);
    }
};
