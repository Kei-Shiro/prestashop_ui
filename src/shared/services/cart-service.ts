// shared/services/cart-service.ts
import type { Cart } from "../types/cart";
import type { Product } from "../types/product";

const CART_KEY = 'shopping_cart';

class CartService {
    private cart: Cart;

    constructor() {
        this.cart = this.loadCart();
    }

    private loadCart(): Cart {
        const savedCart = localStorage.getItem(CART_KEY);
        if (savedCart) {
            return JSON.parse(savedCart);
        }
        return {
            items: [],
            total_quantity: 0,
            total_price: 0
        };
    }

    private saveCart(): void {
        localStorage.setItem(CART_KEY, JSON.stringify(this.cart));
    }

    private updateTotals(): void {
        this.cart.total_quantity = this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cart.total_price = parseFloat(this.cart.items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2));
    }

    getCart(): Cart {
        return this.cart;
    }

    addItem(product: Product, quantity: number = 1): void {
        const existingItem = this.cart.items.find(item => item.product.id_product === product.id_product);

        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.total_price = parseFloat((existingItem.quantity * parseFloat(product.price)).toFixed(2));
        } else {
            this.cart.items.push({
                product,
                quantity,
                total_price: parseFloat((quantity * parseFloat(product.price)).toFixed(2))
            });
        }

        this.updateTotals();
        this.saveCart();
    }

    removeItem(productId: string): void {
        this.cart.items = this.cart.items.filter(item => item.product.id_product !== productId);
        this.updateTotals();
        this.saveCart();
    }

    updateQuantity(productId: string, quantity: number): void {
        const item = this.cart.items.find(item => item.product.id_product === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                item.total_price = parseFloat((quantity * parseFloat(item.product.price)).toFixed(2));
                this.updateTotals();
                this.saveCart();
            }
        }
    }

    clearCart(): void {
        this.cart = {
            items: [],
            total_quantity: 0,
            total_price: 0
        };
        this.saveCart();
    }
}

export default new CartService();