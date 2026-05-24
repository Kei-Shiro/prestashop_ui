import apiService from '@shared/api/api-service';
import { extractIdValue } from '@shared/utils/extractIdValue';
import { ensureArray } from '@shared/utils/arrayUtils';
import type { Customer, CustomerCreatePayload } from '@shared/types/customer';
import type { Address, AddressCreatePayload } from '@shared/types/address';

// Re-export canonical types for consumers
export type { Customer } from '@shared/types/customer';
export type { Address } from '@shared/types/address';

export const customerService = {
    async getAllCustomers(): Promise<Customer[]> {
        const response = await apiService.get<any>('/customers?display=full');
        return ensureArray(response.prestashop?.customers?.customer);
    },

    async getCustomerByEmail(email: string): Promise<Customer | null> {
        try {
            const response = await apiService.get<any>(`/customers?filter[email]=${encodeURIComponent(email)}&display=full`);
            const customerArray = ensureArray(response.prestashop?.customers?.customer);
            return customerArray[0] ?? null;
        } catch {
            return null;
        }
    },

    async getAdresseByCustomerId(id_customer: number): Promise<Address | null> {
        try {
            const res = await apiService.get<any>(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            const addressArray = ensureArray(res.prestashop?.addresses?.address);
            return addressArray[0] ?? null;
        } catch {
            return null;
        }
    },

    async getAllAddressesByCustomerId(id_customer: number): Promise<Address[]> {
        try {
            const res = await apiService.get<any>(`/addresses?filter[id_customer]=${id_customer}&display=full`);
            return ensureArray(res.prestashop?.addresses?.address) as Address[];
        } catch {
            return [];
        }
    },

    async createCustomer(data: { email: string; firstname: string; lastname: string; password?: string }): Promise<number> {
        const payload: { customer: CustomerCreatePayload } = {
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
        const response = await apiService.post<any>('/customers', payload);
        return parseInt(extractIdValue(response.prestashop.customer.id));
    },

    async createAddress(data: AddressCreatePayload): Promise<number> {
        const payload: { address: AddressCreatePayload } = {
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
        const response = await apiService.post<any>('/addresses', payload);
        return parseInt(extractIdValue(response.prestashop.address.id));
    }
};

export default customerService;
