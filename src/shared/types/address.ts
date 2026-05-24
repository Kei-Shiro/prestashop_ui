/**
 * Address model — used for customer delivery/invoice addresses.
 * Based on /addresses endpoint (used heavily in the codebase).
 */

/** Canonical Address model. */
export interface Address {
    id: string;
    id_customer?: string;
    id_country?: string;
    id_state?: string;
    alias: string;
    lastname: string;
    firstname: string;
    address1: string;
    address2?: string;
    city: string;
    postal_code?: string;
    phone?: string;
    phone_mobile?: string;
    company?: string;
    vat_number?: string;
    active?: string;
    deleted?: string;
    date_add?: string;
    date_upd?: string;
}

/** Payload for POST /addresses */
export interface AddressCreatePayload {
    id_customer: number;
    /** Country id (e.g. 8 = France) */
    id_country: number;
    alias: string;
    lastname: string;
    firstname: string;
    address1: string;
    city: string;
    postal_code?: string;
    phone?: string;
}

export type AddressUpdatePayload = Partial<AddressCreatePayload> & { id: number };
