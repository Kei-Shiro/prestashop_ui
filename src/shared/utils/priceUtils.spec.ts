import { describe, it, expect } from 'vitest';
import { DomainPriceService } from './priceUtils';

describe('DomainPriceService.calculateFinalPrice', () => {
    it('should return base price when no combination price is provided', () => {
        expect(DomainPriceService.calculateFinalPrice(10, 20)).toBe(10);
    });
    
    it('should add combination TTC impact to base price', () => {
        // HT impact = 5, tax = 20% -> TTC impact = 6. Base = 10 -> Total = 16
        expect(DomainPriceService.calculateFinalPrice(10, 20, 5)).toBe(16);
    });
    
    it('should handle string values for price, tax, and impact', () => {
        expect(DomainPriceService.calculateFinalPrice("10.5", "20", "5")).toBe(16.5);
    });
});
