/**
 * Customer model — follows /customers?schema=blank from the PrestaShop API.
 */
import type { IdOnly } from './common';

/** Canonical Customer model. */
export interface Customer {
    id: string;
    id_default_group?: string;
    id_lang?: string;
    newsletter_date_add?: string;
    ip_registration_newsletter?: string;
    last_passwd_gen?: string;
    secure_key?: string;
    deleted?: string;
    passwd?: string;
    lastname: string;
    firstname: string;
    email: string;
    id_gender?: string;
    birthday?: string;
    newsletter?: string;
    optin?: string;
    website?: string;
    company?: string;
    siret?: string;
    ape?: string;
    outstanding_allow_amount?: string;
    show_public_prices?: string;
    id_risk?: string;
    max_payment_days?: string;
    active?: string;
    note?: string;
    is_guest?: string;
    id_shop?: string;
    id_shop_group?: string;
    date_add?: string;
    date_upd?: string;
    reset_password_token?: string;
    reset_password_validity?: string;
    associations?: {
        groups?: { group: IdOnly | IdOnly[] };
    };
}

/** Payload for POST /customers */
export interface CustomerCreatePayload {
    passwd: string;
    lastname: string;
    firstname: string;
    email: string;
    id_gender?: number;
    id_default_group?: number;
    active?: number;
    birthday?: string;
    newsletter?: number;
}

export type CustomerUpdatePayload = Partial<CustomerCreatePayload> & { id: number };
