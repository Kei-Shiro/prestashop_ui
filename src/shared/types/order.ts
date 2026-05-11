import { CartItem } from './cart';

export interface Order {
    id: number;
    reference: string;
    totalAmount: number;
    status: string;
    date: string;
    items: CartItem[];
    shippingFee: number;
    paymentMethod: string; // Will be "Cash on Delivery"
}

export interface OrderCreationRequest {
    customerId: number;
    items: { productId: number; quantity: number }[];
    paymentMethod: string;
    totalAmount: number;
}

export interface MappedOrder {
    id: number;
    reference: string;
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
