# Cart Server-First Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore each customer’s open cart from PrestaShop on login/restoreSession, so the cart persists across browsers and server restarts.

**Architecture:** PrestaShop is the source of truth. On login/restoreSession, the app queries PS for the latest non-ordered cart, rebuilds the UI cart, and caches locally. LocalStorage is never authoritative.

**Tech Stack:** Vue 3, Pinia, TypeScript, Vite, PrestaShop WebService API, Vitest (new for unit tests)

---

## File Structure (planned changes)

- Create: `vitest.config.ts` — unit test runner config
- Modify: `package.json` — add `vitest` dev dependency and `test:unit` script
- Create: `src/shared/utils/cart-open.ts` — pure helper for selecting open cart rows
- Create: `src/shared/utils/__tests__/cart-open.test.ts` — unit tests for helper
- Modify: `src/shared/services/order-service.ts` — add `getOpenCartItemsForCustomer()` using helper
- Modify: `src/frontoffice/stores/cart.ts` — add `syncFromServer()` and make PS overwrite local
- Modify: `src/frontoffice/stores/auth.ts` — call `syncFromServer()` after login/restoreSession

---

### Task 1: Add Unit Test Tooling (Vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Write a failing test file scaffold**

Create `src/shared/utils/__tests__/cart-open.test.ts` with a failing placeholder:

```ts
import { describe, it, expect } from 'vitest';

describe('cart-open', () => {
  it('fails until helper is implemented', () => {
    expect(false).toBe(true);
  });
});
```

- [ ] **Step 2: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  }
});
```

- [ ] **Step 3: Add test script + dev dependency**

Update `package.json`:

```json
{
  "scripts": {
    "test:unit": "vitest run"
  },
  "devDependencies": {
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 4: Run tests to confirm failure**

Run: `npm run test:unit`
Expected: FAIL (placeholder test)

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts src/shared/utils/__tests__/cart-open.test.ts
git commit -m "test: add vitest scaffold"
```

---

### Task 2: Implement Open Cart Selection Helper

**Files:**
- Create: `src/shared/utils/cart-open.ts`
- Modify: `src/shared/utils/__tests__/cart-open.test.ts`

- [ ] **Step 1: Write failing test (real cases)**

Replace placeholder test with real cases:

```ts
import { describe, it, expect } from 'vitest';
import { selectOpenCartRows } from '../cart-open';

describe('selectOpenCartRows', () => {
  it('returns rows from most recent non-ordered cart', () => {
    const carts = [
      { id: '10', associations: { cart_rows: { cart_row: [{ id_product: '1', quantity: '1' }] } } },
      { id: '11', associations: { cart_rows: { cart_row: [{ id_product: '2', quantity: '3' }] } } },
    ];
    const used = new Set(['11']);

    const rows = selectOpenCartRows(carts, used);
    expect(rows).toHaveLength(1);
    expect(rows[0].id_product).toBe('1');
    expect(rows[0].quantity).toBe(1);
  });

  it('returns empty when all carts are ordered', () => {
    const carts = [{ id: '11', associations: { cart_rows: { cart_row: [{ id_product: '2', quantity: '1' }] } } }];
    const used = new Set(['11']);

    const rows = selectOpenCartRows(carts, used);
    expect(rows).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm run test:unit`
Expected: FAIL (missing helper)

- [ ] **Step 3: Implement helper**

Create `src/shared/utils/cart-open.ts`:

```ts
export type RawCart = {
  id: string | number;
  associations?: {
    cart_rows?: {
      cart_row?: Array<{ id_product: string; quantity: string | number }> | { id_product: string; quantity: string | number };
    };
  };
};

export function selectOpenCartRows(
  carts: RawCart[],
  usedCartIds: Set<string>
): Array<{ id_product: string; quantity: number }> {
  const ordered = [...carts].sort((a, b) => Number(b.id) - Number(a.id));

  for (const cart of ordered) {
    if (usedCartIds.has(String(cart.id))) continue;
    const raw = cart.associations?.cart_rows?.cart_row;
    if (!raw) continue;
    const rows = Array.isArray(raw) ? raw : [raw];
    const cleaned = rows
      .filter(r => r.id_product && String(r.id_product) !== '0' && Number(r.quantity) > 0)
      .map(r => ({ id_product: String(r.id_product), quantity: Number(r.quantity) }));
    if (cleaned.length > 0) return cleaned;
  }
  return [];
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/utils/cart-open.ts src/shared/utils/__tests__/cart-open.test.ts
git commit -m "feat: add open cart selection helper"
```

---

### Task 3: Load Open Cart Items from PrestaShop

**Files:**
- Modify: `src/shared/services/order-service.ts`

- [ ] **Step 1: Write failing test for mapping (unit)**

Add test to `cart-open.test.ts` for mapping logic used by order-service (kept unit-level):

```ts
import { selectOpenCartRows } from '../cart-open';

it('normalizes quantity to number', () => {
  const carts = [{ id: '1', associations: { cart_rows: { cart_row: { id_product: '9', quantity: '4' } } } }];
  const rows = selectOpenCartRows(carts, new Set());
  expect(rows[0].quantity).toBe(4);
});
```

- [ ] **Step 2: Run tests to confirm failure**

Run: `npm run test:unit`
Expected: FAIL (if helper not updated)

- [ ] **Step 3: Implement `getOpenCartItemsForCustomer`**

Update `order-service.ts`:

```ts
import { selectOpenCartRows } from '../utils/cart-open';

async getOpenCartItemsForCustomer(customerId: number) {
  const ordersRes: any = await apiService.get(`/orders?filter[id_customer]=${customerId}&display=[id_cart]`);
  const ordersRaw = ordersRes?.prestashop?.orders?.order || [];
  const ordersArr = Array.isArray(ordersRaw) ? ordersRaw : [ordersRaw];
  const usedCartIds = new Set(ordersArr.map((o: any) => String(o.id_cart)).filter(Boolean));

  const cartsRes: any = await apiService.get(`/carts?filter[id_customer]=${customerId}&display=full`);
  const cartsRaw = cartsRes?.prestashop?.carts?.cart || [];
  const cartsArr = Array.isArray(cartsRaw) ? cartsRaw : [cartsRaw];

  return selectOpenCartRows(cartsArr, usedCartIds);
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/shared/services/order-service.ts src/shared/utils/cart-open.ts src/shared/utils/__tests__/cart-open.test.ts
git commit -m "feat: load open cart items from PS"
```

---

### Task 4: Server-First Sync in Cart Store

**Files:**
- Modify: `src/frontoffice/stores/cart.ts`

- [ ] **Step 1: Write failing test stub (logic-only)**

Create `src/frontoffice/stores/__tests__/cart-sync.test.ts` with a failing test (manual stub):

```ts
import { describe, it, expect } from 'vitest';

describe('cart sync', () => {
  it('placeholder fails until sync implemented', () => {
    expect(false).toBe(true);
  });
});
```

- [ ] **Step 2: Implement `syncFromServer(customerId)`**

In `cart.ts`, add:

```ts
async function syncFromServer(customerId: number) {
  const rows = await orderService.getOpenCartItemsForCustomer(customerId);
  if (!rows.length) {
    items.value = [];
    _saveToStorage();
    return;
  }

  const products = await Promise.all(
    rows.map(r => productService.getProduct(Number(r.id_product)))
  );

  items.value = rows.map((r, idx) => {
    const product = products[idx];
    const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    return {
      product,
      quantity: r.quantity,
      total_price: price * r.quantity
    };
  });
  _saveToStorage();
}
```

Also remove any “only if local empty” guard so PS always overwrites local.

- [ ] **Step 3: Run tests (expected fail for placeholder)**

Run: `npm run test:unit`
Expected: FAIL (placeholder)

- [ ] **Step 4: Replace placeholder with real test or remove**

Replace the placeholder with a small unit test that calls a pure helper if you extract one. If you don’t extract, remove this test file (no unit tests for store).

- [ ] **Step 5: Commit**

```bash
git add src/frontoffice/stores/cart.ts
git commit -m "feat: sync cart from PS server"
```

---

### Task 5: Auth → Server-First Cart Sync

**Files:**
- Modify: `src/frontoffice/stores/auth.ts`

- [ ] **Step 1: Write failing test placeholder**

Create `src/frontoffice/stores/__tests__/auth-cart-sync.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('auth cart sync', () => {
  it('placeholder fails until auth calls sync', () => {
    expect(false).toBe(true);
  });
});
```

- [ ] **Step 2: Implement sync calls**

In `auth.ts`, after login/restoreSession for authenticated users:

```ts
const cartStore = useCartStore();
cartStore.loadForUser(String(customer.id));
await cartStore.syncFromServer(Number(customer.id));
```

For anonymous login:

```ts
cartStore.loadForUser('anonymous');
```

- [ ] **Step 3: Run tests (expected fail for placeholder)**

Run: `npm run test:unit`
Expected: FAIL (placeholder)

- [ ] **Step 4: Replace placeholder with real test or remove**

If no unit test infrastructure for store, remove placeholder tests to keep suite green.

- [ ] **Step 5: Commit**

```bash
git add src/frontoffice/stores/auth.ts
git commit -m "feat: sync cart from PS after auth"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run unit tests**

Run: `npm run test:unit`
Expected: PASS

- [ ] **Step 2: Run build**

Run: `npm run build:front`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: server-first cart persistence"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Server-first cart sync on login/restoreSession → Task 4 + Task 5
   - Open cart selection based on PS orders → Task 3
   - Local cache only → Task 4

2. **Placeholder scan:**
   - Replace or delete placeholder tests in Task 4/5 before final run.

3. **Type consistency:**
   - Cart rows are normalized to `{id_product, quantity}` in helper.
   - `syncFromServer` uses `Number(r.id_product)` consistently.
