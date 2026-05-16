import apiService from '@shared/api/api-service';
import { AddressData, Address } from '@shared/types/customer';

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
    async getAllAddressesByCustomerId(id_customer: number): Promise<Address[]> {
        try {
            const res: any = await apiService.get(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            const addresses = res.prestashop?.addresses?.address;
            if (!addresses) return [];
            const array = Array.isArray(addresses) ? addresses : [addresses];
            // On s'assure que chaque adresse a un id
            return array.map(addr => addr as Address);
        } catch (e) {
            return [];
        }
    },

    async createCustomer(data: { email: string, firstname: string, lastname: string, password?: string }): Promise<number> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <customer>
        <passwd>${data.password || '123456789'}</passwd>
        <lastname>${data.lastname}</lastname>
        <firstname>${data.firstname}</firstname>
        <email>${data.email}</email>
        <id_gender>1</id_gender>
        <id_default_group>3</id_default_group>
        <active>1</active>
    </customer>
</prestashop>`;
        const response: any = await apiService.post('/customers', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return parseInt(response.prestashop.customer.id);
    },

    async createAddress(data: any): Promise<number> {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop>
    <address>
        <id_customer>${data.id_customer}</id_customer>
        <id_country>${data.id_country || 8}</id_country>
        <alias>${data.alias || 'Mon adresse'}</alias>
        <lastname>${data.lastname}</lastname>
        <firstname>${data.firstname}</firstname>
        <address1>${data.address1}</address1>
        <city>${data.city}</city>
        <postal_code>${data.postal_code}</postal_code>
        <phone>${data.phone || ''}</phone>
    </address>
</prestashop>`;
        const response: any = await apiService.post('/addresses', xml, {
            headers: { 'Content-Type': 'application/xml' }
        });
        return parseInt(response.prestashop.address.id);
    }
};