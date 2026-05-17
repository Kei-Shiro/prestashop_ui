# PrestaShop UI Project

This project is a custom Vue.js interface for a PrestaShop store, featuring both a **Front-office** for customers and a **Back-office** for administrative tasks like inventory imports and order management.

## Project Architecture

The project follows a feature-based architecture:
- `src/backoffice`: Main entry and layout for administrative tasks.
- `src/frontoffice`: Main entry and layout for the customer-facing shop.
- `src/features`: Business logic split by domain (auth, catalog, checkout, inventory, dashboard).
- `src/shared`: Reusable components, types, API clients, and utilities.

## Core Technologies

- **Frontend**: Vue 3 (Composition API) + Vite.
- **State Management**: Pinia.
- **API Communication**: Axios.
- **Data Parsing**: `fast-xml-parser` for PrestaShop XML WebService responses.
- **Styling**: Vanilla CSS.

## Key Development Conventions

### API and XML Serialization
PrestaShop's WebService uses XML. All communication should pass through `src/shared/api/api-service.ts`.
- **Automatic Conversion**: The `apiService` automatically converts outgoing JS objects to XML and incoming XML to JS objects using `Serializer`.
- **Root Tag**: PrestaShop expects a `<prestashop>` root tag. `Serializer.toXml` handles this automatically.
- **Accessing Data**: Responses from `apiService` preserve the root tag. Always access data via `response.prestashop.resource_name`.

### Robust ID and Text Extraction
The XML parser returns complex structures for tags with attributes (e.g., `xlink` on IDs or language IDs).
- **IDs**: Always use `extractIdValue(val)` from `@shared/utils/extractIdValue` to get a clean string ID.
- **Multilingual Strings**: Always use `extractLanguageValue(field)` from `@shared/utils/extractLanguageValue` to handle language objects or direct text.

### Feature Structure
Each feature in `src/features` typically contains:
- `services/`: API interaction logic.
- `stores/`: Pinia state management.
- `components/`: UI components specific to the feature.
- `composables/`: Reusable Vue logic.

## Building and Running

- **Development (Dual Mode)**:
  - Back-office: `npm run dev:back` (starts on port 5173 by default)
  - Front-office: `npm run dev:front` (starts on port 5174 by default)
- **Production Build**: `npm run build`
- **Type Checking**: `npm run vue-tsc`

## Common Tasks

### Adding a new Import Service
Models for CSV rows and API payloads should be added to `src/shared/types/import.ts`. Use the `Serializer` to build payloads and `apiService` for communication.

### Handling Product Variants (Combinations)
Variants are handled in `product-service.ts` via `getCombinations`. The UI in `ProductDetailPage.vue` uses these to dynamically update price and stock. Always ensure both `id_product` and `id_product_attribute` are considered in cart operations.
