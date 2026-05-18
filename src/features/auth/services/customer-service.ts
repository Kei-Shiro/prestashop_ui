import apiService from '@shared/api/api-service';
import { AddressData, Address } from '@shared/types/customer';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';

export const customerService = {

    async getAllCustomers(): Promise<any[]> {
        const response: any = await apiService.get('/customers?display=full');
        const customers = response.prestashop?.customers?.customer;
        if (!customers) return [];
        return ensureArray(customers);
    },

    async getCustomerByEmail(email: string): Promise<any | null> {
        try {
            const response: any = await apiService.get(`/customers?filter[email]=${encodeURIComponent(email)}&display=full`);
            const customers = response.prestashop?.customers?.customer;
            if (!customers) return null;
            const customerArray = ensureArray(customers);
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
            const addressArray = ensureArray(addresses);
            return addressArray[0] || null;
        } catch (e) {
            return null;
        }
    },

    // Retourne TOUTES les adresses du client (tableau vide si aucune)
    async getAllAddressesByCustomerId(id_customer: number): Promise<Address[]> {
        try {
            const res: any = await apiService.get(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            const addresses = res.prestashop?.addresses?.address;
            if (!addresses) return [];
            const array = ensureArray(addresses);
            // On s'assure que chaque adresse a un id
            return array.map(addr => addr as Address);
        } catch (e) {
            return [];
        }
    },

    async createCustomer(data: { email: string, firstname: string, lastname: string, password?: string }): Promise<number> {
        const payload = {
            customer: {
                passwd: data.password || '123456789',
                lastname: data.lastname,
                firstname: data.firstname,
                email: data.email,
                id_gender: 1,
                id_default_group: 3,
                active: 1
            }
        };
        const response: any = await apiService.post('/customers', payload);
        return parseInt(extractIdValue(response.prestashop.customer.id));
    },

    async createAddress(data: any): Promise<number> {
        const payload = {
            address: {
                id_customer: data.id_customer,
                id_country: data.id_country || 8,
                alias: data.alias || 'Mon adresse',
                lastname: data.lastname,
                firstname: data.firstname,
                address1: data.address1,
                city: data.city,
                postal_code: data.postal_code,
                phone: data.phone || ''
            }
        };
        const response: any = await apiService.post('/addresses', payload);
        return parseInt(extractIdValue(response.prestashop.address.id));
    }
};