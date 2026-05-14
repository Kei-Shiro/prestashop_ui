export interface CustomerData {
    email: string;
    firstname: string;
    lastname: string;
    password?: string; // optionnel : on peut générer un mot de passe aléatoire
}

export interface AddressData {
    id?: number;
    alias: string;
    firstname: string;
    lastname: string;
    address1: string;
    city: string;
    postal_code: string;
    phone: string;
    id_country: number; // France = 8
    id_customer?: number;
}

export interface AddressInput {
    alias: string;
    firstname: string;
    lastname: string;
    address1: string;
    city: string;
    postal_code: string;
    phone: string;
    id_country: number;
    id_customer: number;
}

export interface Address extends AddressInput {
    id: number;
}

export interface Customer {
    id: number;
    firstname: string;
    lastname: string;
    email: string;
}


