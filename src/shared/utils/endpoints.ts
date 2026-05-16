/**
 * Endpoints des données métier — peuvent être vidés.
 * Ordre strict : du plus dépendant au moins dépendant (contraintes FK).
 */
export const erasableEndpoints: string[] = [
    // 1. Supply chain (Advanced Stock Management) — du plus enfant au parent
    '/supply_order_receipt_histories',
    '/supply_order_histories',
    '/supply_order_details',
    '/supply_orders',
    '/warehouse_product_locations',
    '/stock_movements',
    '/stocks',
    '/warehouses',

    // 2. SAV / Messages
    '/customer_messages',
    '/messages',
    '/customer_threads',

    // 3. Dépendances commandes (enfants d'orders)
    '/order_cart_rules',
    '/order_payments',
    '/order_slip',
    '/order_invoices',
    '/order_carriers',
    '/order_histories',
    '/customizations',         // AVANT order_details
    '/order_details',
    '/deliveries',

    // 4. Commandes & Paniers
    '/orders',
    '/carts',

    // 5. Promotions
    '/specific_prices',
    '/specific_price_rules',
    '/cart_rules',

    // 6. Catalogue — dépendances avant produits
    '/product_suppliers',
    '/product_customization_fields',
    '/combinations',
    '/product_feature_values',  // AVANT features
    '/product_features',
    '/product_option_values',   // AVANT options
    '/product_options',
    '/tags',
    '/images',                  // images produits
    '/attachments',

    // 7. Entités catalogue
    '/products',
    '/manufacturers',
    '/suppliers',
    // Après /products : category_product déjà nettoyé par Product::delete().
    // delete_filtered → garde Root(1) et Home(2), supprime le reste.
    '/categories',

    // 8. CMS
    '/content_management_system',

    // 9. Clients
    '/guests',
    '/customers',
];

/**
 * Endpoints d'infrastructure — NE JAMAIS supprimer en masse.
 * PrestaShop crashe sans ces données (BO + FO).
 */
export const nonErasableEndpoints: string[] = [
    '/carriers',                  // ≥1 transporteur obligatoire (id=0 par défaut)
    '/configurations',            // PS_LANG_DEFAULT, PS_SHOP_NAME, etc.
    '/contacts',                  // ⚠️ ≥1 contact requis (formulaire FO)
    '/countries',                 // référentiel ISO
    '/currencies',                // ≥1 devise par défaut
    '/employees',                 // ≥1 admin id=1
    '/groups',                    // groupes 1,2,3 hardcodés (visiteur/invité/client)
    '/image_types',               // formats images (regen = crash sans)
    '/languages',                 // ≥1 langue active
    '/order_states',              // états 1-12 hardcodés
    '/price_ranges',              // utilisés par carriers
    '/shop_groups',
    '/shop_urls',
    '/shops',
    '/states',                    // régions liées à countries
    '/stock_movement_reasons',    // raisons système hardcodées
    '/stores',                    // points de vente physiques
    '/supply_order_states',       // états système hardcodés
    '/tax_rule_groups',
    '/tax_rules',
    '/taxes',
    '/translated_configurations', // config par langue
    '/weight_ranges',             // utilisés par carriers
    '/zones',                     // référentiel géo
];


