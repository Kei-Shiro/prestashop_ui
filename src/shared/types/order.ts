import { CartItem } from './cart';

// shared/types/order.ts
export interface Order {
    id: string;
    date: string;
    status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
    items: CartItem[];
    total_price: number;
    payment_method: 'cash_on_delivery';
    shipping_address: Address;
    customer_info: CustomerInfo;
}

export interface Address {
    full_name: string;
    address: string;
    city: string;
    postal_code: string;
    phone: string;
}

export interface CustomerInfo {
    email: string;
    phone: string;
}

export interface MappedOrder {
    id: number;
    reference: string;
    customerId?: number;
    customerName: string;
    totalPaid: string;
    payment: string;
    dateAdd: string;
    currentState: {
        id: number;
        label: string;
        color: string;
    };
}
