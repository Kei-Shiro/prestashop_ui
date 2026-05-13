# PrestaShop Import Architecture Spec

## 1. Overview
This specification details the architecture for expanding the existing Vue/Vite PrestaShop import orchestrator. The goal is to fully support the complex relational data structure across three distinct files (Products, Combinations/Stocks, and Customers/Orders), ensuring accurate calculations for taxes and prices, proper linkage of combinations, and correct management of native PrestaShop stock entries.

## 2. Core Architectural Approach
The system uses a **"Stateful Orchestrator"** pattern within the frontend. Instead of resolving dependencies "lazily" via repetitive GET requests, the orchestrator acts as an in-memory database during the import process. It extracts, transforms, creates, and caches parent entities before processing child entities. This drastically reduces network latency and prevents duplicate entries.

## 3. Detailed Data Flow & Logic

### 3.1. Phase 1: Taxes and Product Prices (File 1)
- **Extraction:** Scan all "product" rows to extract unique tax strings (e.g., "1,65%").
- **Creation:** For each unique tax, create via API:
  - `tax_rules_group`
  - `tax` (with parsed numeric rate)
  - `tax_rule` (linking the tax to the group)
- **Caching:** Store the mapping of the original string to its `id_tax_rules_group` and numeric rate.
- **Price Calculation:** When mapping products, parse `prix_ttc` (converting commas to dots). Look up the tax rate from the cache. Calculate `price` (HT) as `prix_ttc / (1 + (rate / 100))`.
- **Product Caching:** Cache the created `id_product`, its base `prix_ttc`, and its tax rate for use in subsequent phases.

### 3.2. Phase 2: Combinations and Attributes (File 2)
- **Options & Values Extraction:** Extract unique "spécificités" (e.g., "taille") and their "valeurs" (e.g., "ngoza").
- **Attribute Creation:** 
  - Create `product_option` (group_type = 'select') for each specificity.
  - Create `product_option_value` for each value, linked to its parent option.
  - Cache all generated IDs.
- **Combination Import:** For each row in File 2:
  - Generate a unique reference (e.g., `[ParentRef]-[Value]`).
  - Retrieve the parent product ID and base `prix_ttc` from the cache.
  - Calculate `price` (impact): `(row.prix_vente_ttc - parent.prix_ttc) / (1 + (parent.rate / 100))`.
  - Build the XML, including the `<associations><product_option_values>` tags using the cached attribute IDs.
  - Create the combination via API and cache its `id_product_attribute`.

### 3.3. Phase 3: Stock Management (File 2)
PrestaShop auto-generates a zero-quantity `stock_available` row when a product or combination is created. Creating new stock rows via POST leads to duplicates and errors.
- **Update Process:**
  - For items with combinations: Perform a `GET /api/stock_availables?filter[id_product_attribute]=[X]` to find the auto-generated row.
  - For items without combinations: Perform a `GET /api/stock_availables?filter[id_product]=[Y]` (where `id_product_attribute` is 0/null).
  - Perform a `PUT` request on that specific stock ID to update the `quantity`.

### 3.4. Phase 4: Customers and Orders (File 3)
- **Customers:** Check for existing emails. If not found, create the customer.
  - **Passwords:** The frontend cannot retrieve PrestaShop's salt to hash passwords natively. As the API expects a plaintext password and hashes it automatically (or depending on specific PS 1.7+ setups, handles it internally), the orchestrator will pass the raw password or generate a random secure string if required by security policies.
- **Addresses:** Create a default address linked to the customer.
- **Orders:** 
  - Parse the "achat" tuples (e.g., `("T_01";3;"ngoza")`).
  - Resolve the product reference and attribute value to their respective cached IDs.
  - Create the `cart` containing the items.
  - Create the `order` linked to the cart, customer, and address.
  - Map textual statuses (e.g., "paiement accepté") to valid `id_order_state` values.

## 4. Error Handling and Resiliency
- Missing dependencies (e.g., a combination referencing a non-existent product) will be logged as `MISSING_DEPENDENCY` errors and the specific row will be skipped without halting the entire process.
- The `ImportDetail` tracking will accurately reflect skipped rows vs. API failures.