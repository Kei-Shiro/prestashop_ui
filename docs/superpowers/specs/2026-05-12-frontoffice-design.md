# FrontOffice E-commerce Architecture Design

## 1. Overview
This document specifies the design for a new e-commerce FrontOffice interface using Vue 3, Tailwind CSS, Pinia, and Vue Router. The focus is on a clean, classic e-commerce design with a straightforward "Cash on Delivery" checkout flow.

## 2. State Management (Pinia)
Two primary stores will be used to manage business logic clearly and independently:

*   **`useCartStore` (`src/frontoffice/stores/cart.ts`)**
    *   **State:** `items` (Array of `{ product, quantity }`).
    *   **Getters:** `totalItems` (sum of quantities), `totalPrice` (sum of price * quantity).
    *   **Actions:** `add(product, quantity)`, `remove(productId)`, `updateQuantity(productId, qty)`, `clear()`.
*   **`useCheckoutStore` (`src/frontoffice/stores/checkout.ts`)**
    *   *Dedicated to the order placement workflow.*
    *   **State:** `isProcessing` (boolean), `error` (string | null).
    *   **Actions:** `placeOrder(cartItems, totalPrice)` -> Calls API via `orderService.createOrder` (hardcoding 'Cash on Delivery' and 0 shipping fees), then clears the cart on success.

## 3. UI Components (`src/frontoffice/components/`)
*   **`Navbar.vue`**: Fixed top header containing the logo, navigation links ("Accueil", "Mes Commandes"), and a Cart icon with a dynamic item count badge. Toggles the `CartDrawer`.
*   **`ProductCard.vue`**: Reusable component for product grids. Displays product image, name, price, and an "Add to Cart" button.
*   **`CartDrawer.vue`**: A right-side sliding drawer (sidebar) displaying current cart items, quantity modifiers, and a "Checkout" button routing to `/checkout`.

## 4. Pages (`src/frontoffice/pages/`)
*   **`HomePage.vue`**: Uses `useProduct` to fetch products and renders them using a responsive grid of `ProductCard` components.
*   **`ProductDetailPage.vue`**: Displays comprehensive details for a single product (large image, full description) with quantity selection and add-to-cart functionality.
*   **`CheckoutPage.vue`**: A streamlined, single-page checkout. Displays a cart summary, confirms "Paiement à la livraison" (Cash on Delivery), and features a final "Commander" (Place Order) button.
*   **`MyOrdersPage.vue`**: Lists past orders for the current user (using a hardcoded customer ID of 1 for the scope of this project), utilizing an updated `orderService`.

## 5. Layout and Routing
*   **`ShopLayout.vue`**: The master wrapper component. Contains `<Navbar />`, `<router-view />` for dynamic page content, and `<CartDrawer />` for global access to the cart.
*   **`router/index.ts` Routes:**
    *   `/` -> `HomePage.vue`
    *   `/product/:id` -> `ProductDetailPage.vue`
    *   `/checkout` -> `CheckoutPage.vue`
    *   `/my-orders` -> `MyOrdersPage.vue`

## 6. Styling and UI/UX
*   **Framework:** Tailwind CSS.
*   **Theme:** Clean, minimalist design emphasizing product imagery and clear calls to action. We will respect existing CSS variables defined in `src/shared/style.css` if applicable, applying them via Tailwind arbitrary values or custom configuration if needed, though pure Tailwind utility classes are preferred for speed and maintainability.
*   **Responsiveness:** Mobile-first approach using standard Tailwind breakpoints.