# Cart Persistence (Server-First) Design

## Goal
Ensure each customer sees their own open (not-yet-ordered) cart after server restart, across browsers, using PrestaShop as the source of truth. LocalStorage remains only a cache, never authoritative.

## Scope
- Frontoffice cart persistence
- Server-first sync with PrestaShop carts/orders
- Per-customer restoration

## Architecture
### Source of Truth
PrestaShop (PS) is authoritative. On login or restoreSession, the app loads the most recent open cart from PS and rebuilds the UI cart state.

### Local Cache
LocalStorage stores the cart for faster UI. It is always overwritten by PS on login/restore.

## Data Flow
1. `auth.restoreSession()` runs in router guard.
2. If a user is found, call `cart.loadForUser(userId)` to set the active local key.
3. Call `cart.syncFromServer(userId)`:
   - Fetch customer orders → collect `id_cart` used in orders
   - Fetch customer carts (full)
   - Pick most recent cart not in orders
   - Extract cart_rows: `{ id_product, quantity }`
   - Fetch product details for each cart_row
   - Build `CartItem[]` and set cart state
4. Save rebuilt cart to LocalStorage.

## Server Query Logic
### Orders
`GET /orders?filter[id_customer]=X&display=[id_cart]`

### Carts
`GET /carts?filter[id_customer]=X&display=full`

### Open Cart Selection
- Sort carts by id desc (most recent)
- Exclude carts whose id is in order list
- Use first remaining cart

## Cart Reconstruction
For each cart_row:
- `productService.getProduct(id_product)`
- `total_price = product.price * quantity`
- Build `CartItem`

## Error Handling
- If PS calls fail: log warning, keep empty cart (no crash)
- If no open cart: keep empty cart

## Performance
- n product fetches for n cart rows
- Acceptable for evaluation scope

## Testing
- User creates cart, logs out, refreshes → cart restored
- User logs in from another browser → cart restored from PS
- Cart emptied after order → should remain empty on next login
