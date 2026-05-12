import apiService from './api-service';
import { AddressData } from '../types/customer';

export const customerService = {

    async getAllCustomers(): Promise<any[]> {
        const response: any = await apiService.get('/customers?display=full');
        const customers = response.prestashop?.customers?.customer;
        if (!customers) return [];
        return Array.isArray(customers) ? customers : [customers];
    },

    async getCustomerByEmail(email: string): Promise<any | null> {
        try {
            const response: any = await apiService.get(`/customers?filter[email]=${encodeURIComponent(email)}&display=full`);
            const customers = response.prestashop?.customers?.customer;
            if (!customers) return null;
            const customerArray = Array.isArray(customers) ? customers : [customers];
            if (customerArray.length === 0) return null;
            return customerArray[0];
        } catch (e) {
            return null;
        }
    },

    // Retourne la PREMIÈRE adresse du client (ou null)
    async getAdresseByCustomerId(id_customer: number): Promise<AddressData | null> {
        try {
            const res: any = await apiService.get(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            const addresses = res.prestashop?.addresses?.address;
            if (!addresses) return null;
            const addressArray = Array.isArray(addresses) ? addresses : [addresses];
            return addressArray[0] || null;
        } catch (e) {
            return null;
        }
    },

    // Retourne TOUTES les adresses du client (tableau vide si aucune)
    async getAllAddressesByCustomerId(id_customer: number): Promise<AddressData[]> {
        try {
            const res: any = await apiService.get(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            const addresses = res.prestashop?.addresses?.address;
            if (!addresses) return [];
            return Array.isArray(addresses) ? addresses : [addresses];
        } catch (e) {
            return [];
        }
    }
};