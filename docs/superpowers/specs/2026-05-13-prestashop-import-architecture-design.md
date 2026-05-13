# PrestaShop Import Architecture Spec

## 1. Overview
This specification details the architecture for expanding the existing Vue/Vite PrestaShop import orchestrator. The goal is to fully support the complex relational data structure across three distinct files (Products, Combinations/Stocks, and Customers/Orders), ensuring accurate calculations for taxes and prices, proper linkage of combinations, and correct management of native PrestaShop stock entries.

## 2. Core Architectural Approach
The system uses a **"Stateful Orchestrator"** pattern within the frontend. Instead of resolving dependencies "lazily" via repetitive GET requests, the orchestrator acts as an in-memory database during the import process. It extracts, transforms, creates, and caches parent entities before processing child entities. This drastically reduces network latency and prevents duplicate entries.

All entities will default to `id_lang=1` (French) where applicable. Numeric parsing will robustly handle French commas and potential negative values.

## 3. Detailed Data Flow & Logic

### 3.1. Phase 1: Categories and Taxes
- **Categories Extraction:** Scan "product" rows to extract unique categories (e.g., "Akanjo", "Accessoire").
- **Categories Creation:** Create missing categories via API and cache `category_name -> id_category`.
- **Taxes Extraction:** Scan all "product" rows to extract unique tax strings (e.g., "1,65%").
- **Taxes Creation:** For each unique tax, create via API:
  - `tax_rules_group`
  - `tax` (with parsed numeric rate)
  - `tax_rule` (linking the tax to the group)
- **Caching:** Store the mapping of the original string to its `id_tax_rules_group` and numeric rate.

### 3.2. Phase 2: Products (File 1)
- **Price Calculation:** When mapping products, parse `prix_ttc` (converting commas to dots). Look up the tax rate from the cache. Calculate `price` (HT) as `prix_ttc / (1 + (rate / 100))`.
- **Product Creation:** Create the product via API, linking it to the cached category ID and tax rules group ID.
- **Product Caching:** Cache the created `id_product`, its base `prix_ttc`, and its tax rate for use in subsequent phases.

### 3.3. Phase 3: Combinations, Attributes, and Base Stocks (File 2)
- **Options & Values Extraction:** Extract unique "spécificités" (e.g., "taille") and their "valeurs" (e.g., "ngoza").
- **Attribute Creation:** 
  - Create `product_option` (group_type = 'select') for each specificity.
  - Create `product_option_value` for each value, linked to its parent option.
  - Cache all generated IDs.
- **Processing File 2 Rows:** For each row:
  - Verify parent product exists in cache (log `MISSING_DEPENDENCY` and skip if not).
  - **Case A: Row has combinations (spécificité is present):**
    - Generate a unique reference (e.g., `[ParentRef]-[Value]`).
    - Calculate `price` (impact): `(row.prix_vente_ttc - parent.prix_ttc) / (1 + (parent.rate / 100))`.
    - Build XML using `<associations><product_option_values>` with cached attribute IDs.
    - Create combination via API, cache `id_product_attribute`.
  - **Case B: Row has NO combinations (e.g., C_03, M_02):**
    - Compare `row.prix_vente_ttc` to parent's original `prix_ttc`. If different, update the parent product's base price via `PUT /api/products`.
    - Note `id_product_attribute = 0` for stock updates.

### 3.4. Phase 4: Stock Management (File 2)
PrestaShop auto-generates a zero-quantity `stock_available` row when a product or combination is created. Creating new stock rows via POST leads to duplicates and errors.
- **Update Process:**
  - For items with combinations: Perform a `GET /api/stock_availables?filter[id_product_attribute]=[X]` to find the auto-generated row.
  - For items without combinations: Perform a `GET /api/stock_availables?filter[id_product]=[Y]` (where `id_product_attribute` is 0/null).
  - Perform a `PUT` request on that specific stock ID to update the `quantity`.

### 3.5. Phase 5: Customers and Orders (File 3)
- **Customers:** Check for existing emails. If not found, create the customer.
  - **Passwords:** The PrestaShop 1.7+ API handles automatic hashing of plaintext passwords. If the password column is empty or missing, the orchestrator will generate a secure random string (e.g., `Math.random().toString(36)`) to satisfy the API.
- **Addresses:** Create a default address linked to the customer.
- **Orders:** 
  - Parse the "achat" tuples (e.g., `("T_01";3;"ngoza")` or `("C_03";1;")`).
  - Resolve the product reference.
  - For the combination value: If empty (e.g., `("C_03";1;")`), set `id_product_attribute = 0`. Else, resolve to the cached combination ID.
  - Create the `cart` containing the items.
  - Create the `order` linked to the cart, customer, and address.
  - Map textual statuses (e.g., "paiement accepté") to valid `id_order_state` values. A hardcoded mapping will map "paiement accepté" to ID `2` (`PS_OS_PAYMENT`).

## 4. Error Handling and Resiliency
- Missing dependencies (e.g., a combination referencing a non-existent product) will be logged as `MISSING_DEPENDENCY` errors and the specific row will be skipped without halting the entire process.
- The `ImportDetail` tracking will accurately reflect skipped rows vs. API failures. We will distinguish between `VALIDATION` errors (e.g. malformed data) and `API_ERROR` (e.g. 500, network timeout).