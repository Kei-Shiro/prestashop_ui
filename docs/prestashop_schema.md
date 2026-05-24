# PrestaShop Database Schema & API Models

This file contains the fields (columns) and associations retrieved directly from the PrestaShop API schemas (`?schema=blank`).

## Table of Contents

- ~~/stockmvtapi/stockmvt (Failed: Request failed with status code 400)~~
- [/supply_order_receipt_histories (`supply_order_receipt_history`)](#supply_order_receipt_history)
- [/supply_order_histories (`supply_order_history`)](#supply_order_history)
- [/supply_order_details (`supply_order_detail`)](#supply_order_detail)
- [/supply_orders (`supply_order`)](#supply_order)
- [/warehouse_product_locations (`warehouse_product_location`)](#warehouse_product_location)
- [/stock_movements (`stock_mvt`)](#stock_mvt)
- [/stocks (`stock`)](#stock)
- [/warehouses (`warehouse`)](#warehouse)
- [/customer_messages (`customer_message`)](#customer_message)
- [/messages (`message`)](#message)
- [/customer_threads (`customer_thread`)](#customer_thread)
- [/order_cart_rules (`order_cart_rule`)](#order_cart_rule)
- [/order_payments (`order_payment`)](#order_payment)
- [/order_slip (`order_slip`)](#order_slip)
- [/order_invoices (`order_invoice`)](#order_invoice)
- [/order_carriers (`order_carrier`)](#order_carrier)
- [/order_histories (`order_history`)](#order_history)
- [/customizations (`customization`)](#customization)
- [/order_details (`order_detail`)](#order_detail)
- [/deliveries (`delivery`)](#delivery)
- [/orders (`order`)](#order)
- [/carts (`cart`)](#cart)
- [/specific_prices (`specific_price`)](#specific_price)
- [/specific_price_rules (`specific_price_rule`)](#specific_price_rule)
- [/cart_rules (`cart_rule`)](#cart_rule)
- [/product_suppliers (`product_supplier`)](#product_supplier)
- [/product_customization_fields (`customization_field`)](#customization_field)
- [/combinations (`combination`)](#combination)
- [/product_feature_values (`product_feature_value`)](#product_feature_value)
- [/product_features (`product_feature`)](#product_feature)
- [/product_option_values (`product_option_value`)](#product_option_value)
- [/product_options (`product_option`)](#product_option)
- [/tags (`tag`)](#tag)
- [/images (`image_types`)](#image_types)
- [/attachments (`attachment`)](#attachment)
- [/products (`product`)](#product)
- [/manufacturers (`manufacturer`)](#manufacturer)
- [/suppliers (`supplier`)](#supplier)
- [/categories (`category`)](#category)
- [/content_management_system (`content`)](#content)
- [/guests (`guest`)](#guest)
- [/customers (`customer`)](#customer)
- [/carriers (`carrier`)](#carrier)
- [/configurations (`configuration`)](#configuration)
- [/contacts (`contact`)](#contact)
- [/countries (`country`)](#country)
- [/currencies (`currency`)](#currency)
- [/employees (`employee`)](#employee)
- [/groups (`group`)](#group)
- [/image_types (`image_type`)](#image_type)
- [/languages (`language`)](#language)
- [/order_states (`order_state`)](#order_state)
- [/price_ranges (`price_range`)](#price_range)
- [/shop_groups (`shop_group`)](#shop_group)
- [/shop_urls (`shop_url`)](#shop_url)
- [/shops (`shop`)](#shop)
- [/states (`state`)](#state)
- [/stock_movement_reasons (`stock_movement_reason`)](#stock_movement_reason)
- [/stores (`store`)](#store)
- [/supply_order_states (`supply_order_state`)](#supply_order_state)
- [/tax_rule_groups (`tax_rule_group`)](#tax_rule_group)
- [/tax_rules (`tax_rule`)](#tax_rule)
- [/taxes (`tax`)](#tax)
- [/translated_configurations (`translated_configuration`)](#translated_configuration)
- [/weight_ranges (`weight_range`)](#weight_range)
- [/zones (`zone`)](#zone)

---

### <a name="supply_order_receipt_history"></a>/supply_order_receipt_histories (`supply_order_receipt_history`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_supply_order_detail` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_supply_order_state` | ❌ No | ❌ No | |
| `employee_firstname` | ❌ No | ❌ No | |
| `employee_lastname` | ❌ No | ❌ No | |
| `quantity` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="supply_order_history"></a>/supply_order_histories (`supply_order_history`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_supply_order` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_state` | ❌ No | ❌ No | |
| `employee_firstname` | ❌ No | ❌ No | |
| `employee_lastname` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="supply_order_detail"></a>/supply_order_details (`supply_order_detail`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_supply_order` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `supplier_reference` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `ean13` | ❌ No | ❌ No | |
| `isbn` | ❌ No | ❌ No | |
| `upc` | ❌ No | ❌ No | |
| `mpn` | ❌ No | ❌ No | |
| `exchange_rate` | ❌ No | ❌ No | |
| `unit_price_te` | ❌ No | ❌ No | |
| `quantity_expected` | ❌ No | ❌ No | |
| `quantity_received` | ❌ No | ❌ No | |
| `price_te` | ❌ No | ❌ No | |
| `discount_rate` | ❌ No | ❌ No | |
| `discount_value_te` | ❌ No | ❌ No | |
| `price_with_discount_te` | ❌ No | ❌ No | |
| `tax_rate` | ❌ No | ❌ No | |
| `tax_value` | ❌ No | ❌ No | |
| `price_ti` | ❌ No | ❌ No | |
| `tax_value_with_order_discount` | ❌ No | ❌ No | |
| `price_with_order_discount_te` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="supply_order"></a>/supply_orders (`supply_order`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_supplier` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `id_warehouse` | ❌ No | ❌ No | |
| `id_supply_order_state` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `supplier_name` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `date_delivery_expected` | ❌ No | ❌ No | |
| `total_te` | ❌ No | ❌ No | |
| `total_with_discount_te` | ❌ No | ❌ No | |
| `total_ti` | ❌ No | ❌ No | |
| `total_tax` | ❌ No | ❌ No | |
| `discount_rate` | ❌ No | ❌ No | |
| `discount_value_te` | ❌ No | ❌ No | |
| `is_template` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |

#### Associations

- **`supply_order_details`**: Contains fields: `id`, `id_product`, `id_product_attribute`, `supplier_reference`, `product_name`

---

### <a name="warehouse_product_location"></a>/warehouse_product_locations (`warehouse_product_location`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `id_warehouse` | ❌ No | ❌ No | |
| `location` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="stock_mvt"></a>/stock_movements (`stock_mvt`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `id_warehouse` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `management_type` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_stock` | ❌ No | ❌ No | |
| `id_stock_mvt_reason` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `id_supply_order` | ❌ No | ❌ No | |
| `product_name` | ✅ Yes | ❌ No | |
| `ean13` | ❌ No | ❌ No | |
| `upc` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `mpn` | ❌ No | ❌ No | |
| `physical_quantity` | ❌ No | ❌ No | |
| `sign` | ❌ No | ❌ No | |
| `last_wa` | ❌ No | ❌ No | |
| `current_wa` | ❌ No | ❌ No | |
| `price_te` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="stock"></a>/stocks (`stock`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_warehouse` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `ean13` | ❌ No | ❌ No | |
| `isbn` | ❌ No | ❌ No | |
| `upc` | ❌ No | ❌ No | |
| `mpn` | ❌ No | ❌ No | |
| `physical_quantity` | ❌ No | ❌ No | |
| `usable_quantity` | ❌ No | ❌ No | |
| `price_te` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="warehouse"></a>/warehouses (`warehouse`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_address` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `management_type` | ❌ No | ❌ No | |

#### Associations

- **`stocks`**: Contains fields: `id`
- **`carriers`**: Contains fields: `id`
- **`shops`**: Contains fields: `id`, `name`

---

### <a name="customer_message"></a>/customer_messages (`customer_message`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_customer_thread` | ❌ No | ❌ No | |
| `ip_address` | ❌ No | ❌ No | |
| `message` | ❌ No | ❌ No | |
| `file_name` | ❌ No | ❌ No | |
| `user_agent` | ❌ No | ❌ No | |
| `private` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `read` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="message"></a>/messages (`message`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_cart` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `message` | ❌ No | ❌ No | |
| `private` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="customer_thread"></a>/customer_threads (`customer_thread`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_contact` | ❌ No | ❌ No | |
| `email` | ❌ No | ❌ No | |
| `token` | ❌ No | ❌ No | |
| `status` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |

#### Associations

- **`customer_messages`**: Contains fields: `id`

---

### <a name="order_cart_rule"></a>/order_cart_rules (`order_cart_rule`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `id_cart_rule` | ❌ No | ❌ No | |
| `id_order_invoice` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `value` | ❌ No | ❌ No | |
| `value_tax_excl` | ❌ No | ❌ No | |
| `free_shipping` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order_payment"></a>/order_payments (`order_payment`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `order_reference` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `amount` | ❌ No | ❌ No | |
| `payment_method` | ❌ No | ❌ No | |
| `conversion_rate` | ❌ No | ❌ No | |
| `transaction_id` | ❌ No | ❌ No | |
| `card_number` | ❌ No | ❌ No | |
| `card_brand` | ❌ No | ❌ No | |
| `card_expiration` | ❌ No | ❌ No | |
| `card_holder` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order_slip"></a>/order_slip (`order_slip`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `conversion_rate` | ❌ No | ❌ No | |
| `total_products_tax_excl` | ❌ No | ❌ No | |
| `total_products_tax_incl` | ❌ No | ❌ No | |
| `total_shipping_tax_excl` | ❌ No | ❌ No | |
| `total_shipping_tax_incl` | ❌ No | ❌ No | |
| `amount` | ❌ No | ❌ No | |
| `shipping_cost` | ❌ No | ❌ No | |
| `shipping_cost_amount` | ❌ No | ❌ No | |
| `partial` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `order_slip_type` | ❌ No | ❌ No | |

#### Associations

- **`order_slip_details`**: Contains fields: `id`, `id_order_detail`, `product_quantity`, `amount_tax_excl`, `amount_tax_incl`

---

### <a name="order_invoice"></a>/order_invoices (`order_invoice`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `number` | ❌ No | ❌ No | |
| `delivery_number` | ❌ No | ❌ No | |
| `delivery_date` | ❌ No | ❌ No | |
| `total_discount_tax_excl` | ❌ No | ❌ No | |
| `total_discount_tax_incl` | ❌ No | ❌ No | |
| `total_paid_tax_excl` | ❌ No | ❌ No | |
| `total_paid_tax_incl` | ❌ No | ❌ No | |
| `total_products` | ❌ No | ❌ No | |
| `total_products_wt` | ❌ No | ❌ No | |
| `total_shipping_tax_excl` | ❌ No | ❌ No | |
| `total_shipping_tax_incl` | ❌ No | ❌ No | |
| `shipping_tax_computation_method` | ❌ No | ❌ No | |
| `total_wrapping_tax_excl` | ❌ No | ❌ No | |
| `total_wrapping_tax_incl` | ❌ No | ❌ No | |
| `shop_address` | ❌ No | ❌ No | |
| `note` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order_carrier"></a>/order_carriers (`order_carrier`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `id_order_invoice` | ❌ No | ❌ No | |
| `weight` | ❌ No | ❌ No | |
| `shipping_cost_tax_excl` | ❌ No | ❌ No | |
| `shipping_cost_tax_incl` | ❌ No | ❌ No | |
| `tracking_number` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order_history"></a>/order_histories (`order_history`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_employee` | ❌ No | ❌ No | |
| `id_order_state` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="customization"></a>/customizations (`customization`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_address_delivery` | ❌ No | ❌ No | |
| `id_cart` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `quantity` | ❌ No | ❌ No | |
| `quantity_refunded` | ❌ No | ❌ No | |
| `quantity_returned` | ❌ No | ❌ No | |
| `in_cart` | ❌ No | ❌ No | |

#### Associations

- **`customized_data_text_fields`**: Contains fields: `id_customization_field`, `value`
- **`customized_data_images`**: Contains fields: `id_customization_field`, `value`

---

### <a name="order_detail"></a>/order_details (`order_detail`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_order` | ❌ No | ❌ No | |
| `product_id` | ❌ No | ❌ No | |
| `product_attribute_id` | ❌ No | ❌ No | |
| `product_quantity_reinjected` | ❌ No | ❌ No | |
| `group_reduction` | ❌ No | ❌ No | |
| `discount_quantity_applied` | ❌ No | ❌ No | |
| `download_hash` | ❌ No | ❌ No | |
| `download_deadline` | ❌ No | ❌ No | |
| `id_order_invoice` | ❌ No | ❌ No | |
| `id_warehouse` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_customization` | ❌ No | ❌ No | |
| `product_name` | ❌ No | ❌ No | |
| `product_quantity` | ❌ No | ❌ No | |
| `product_quantity_in_stock` | ❌ No | ❌ No | |
| `product_quantity_return` | ❌ No | ❌ No | |
| `product_quantity_refunded` | ❌ No | ❌ No | |
| `product_price` | ❌ No | ❌ No | |
| `reduction_percent` | ❌ No | ❌ No | |
| `reduction_amount` | ❌ No | ❌ No | |
| `reduction_amount_tax_incl` | ❌ No | ❌ No | |
| `reduction_amount_tax_excl` | ❌ No | ❌ No | |
| `product_quantity_discount` | ❌ No | ❌ No | |
| `product_ean13` | ❌ No | ❌ No | |
| `product_isbn` | ❌ No | ❌ No | |
| `product_upc` | ❌ No | ❌ No | |
| `product_mpn` | ❌ No | ❌ No | |
| `product_reference` | ❌ No | ❌ No | |
| `product_supplier_reference` | ❌ No | ❌ No | |
| `product_weight` | ❌ No | ❌ No | |
| `tax_computation_method` | ❌ No | ❌ No | |
| `id_tax_rules_group` | ❌ No | ❌ No | |
| `ecotax` | ❌ No | ❌ No | |
| `ecotax_tax_rate` | ❌ No | ❌ No | |
| `download_nb` | ❌ No | ❌ No | |
| `unit_price_tax_incl` | ❌ No | ❌ No | |
| `unit_price_tax_excl` | ❌ No | ❌ No | |
| `total_price_tax_incl` | ❌ No | ❌ No | |
| `total_price_tax_excl` | ❌ No | ❌ No | |
| `total_shipping_price_tax_excl` | ❌ No | ❌ No | |
| `total_shipping_price_tax_incl` | ❌ No | ❌ No | |
| `purchase_supplier_price` | ❌ No | ❌ No | |
| `original_product_price` | ❌ No | ❌ No | |
| `original_wholesale_price` | ❌ No | ❌ No | |
| `total_refunded_tax_excl` | ❌ No | ❌ No | |
| `total_refunded_tax_incl` | ❌ No | ❌ No | |

#### Associations

- **`taxes`**: Contains fields: `id`

---

### <a name="delivery"></a>/deliveries (`delivery`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `id_range_price` | ❌ No | ❌ No | |
| `id_range_weight` | ❌ No | ❌ No | |
| `id_zone` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `price` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order"></a>/orders (`order`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_address_delivery` | ❌ No | ❌ No | |
| `id_address_invoice` | ❌ No | ❌ No | |
| `id_cart` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `current_state` | ❌ No | ❌ No | |
| `module` | ❌ No | ❌ No | |
| `invoice_number` | ❌ No | ❌ No | |
| `invoice_date` | ❌ No | ❌ No | |
| `delivery_number` | ❌ No | ❌ No | |
| `delivery_date` | ❌ No | ❌ No | |
| `valid` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `shipping_number` | ❌ No | ❌ No | |
| `note` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `secure_key` | ❌ No | ❌ No | |
| `payment` | ❌ No | ❌ No | |
| `recyclable` | ❌ No | ❌ No | |
| `gift` | ❌ No | ❌ No | |
| `gift_message` | ❌ No | ❌ No | |
| `mobile_theme` | ❌ No | ❌ No | |
| `total_discounts` | ❌ No | ❌ No | |
| `total_discounts_tax_incl` | ❌ No | ❌ No | |
| `total_discounts_tax_excl` | ❌ No | ❌ No | |
| `total_paid` | ❌ No | ❌ No | |
| `total_paid_tax_incl` | ❌ No | ❌ No | |
| `total_paid_tax_excl` | ❌ No | ❌ No | |
| `total_paid_real` | ❌ No | ❌ No | |
| `total_products` | ❌ No | ❌ No | |
| `total_products_wt` | ❌ No | ❌ No | |
| `total_shipping` | ❌ No | ❌ No | |
| `total_shipping_tax_incl` | ❌ No | ❌ No | |
| `total_shipping_tax_excl` | ❌ No | ❌ No | |
| `carrier_tax_rate` | ❌ No | ❌ No | |
| `total_wrapping` | ❌ No | ❌ No | |
| `total_wrapping_tax_incl` | ❌ No | ❌ No | |
| `total_wrapping_tax_excl` | ❌ No | ❌ No | |
| `round_mode` | ❌ No | ❌ No | |
| `round_type` | ❌ No | ❌ No | |
| `conversion_rate` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |

#### Associations

- **`order_rows`**: Contains fields: `id`, `product_id`, `product_attribute_id`, `product_quantity`, `product_name`, `product_reference`, `product_ean13`, `product_isbn`, `product_upc`, `product_price`, `id_customization`, `unit_price_tax_incl`, `unit_price_tax_excl`

---

### <a name="cart"></a>/carts (`cart`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_address_delivery` | ❌ No | ❌ No | |
| `id_address_invoice` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_guest` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `recyclable` | ❌ No | ❌ No | |
| `gift` | ❌ No | ❌ No | |
| `gift_message` | ❌ No | ❌ No | |
| `mobile_theme` | ❌ No | ❌ No | |
| `delivery_option` | ❌ No | ❌ No | |
| `secure_key` | ❌ No | ❌ No | |
| `allow_seperated_package` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |

#### Associations

- **`cart_rows`**: Contains fields: `id_product`, `id_product_attribute`, `id_address_delivery`, `id_customization`, `quantity`

---

### <a name="specific_price"></a>/specific_prices (`specific_price`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_cart` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `id_country` | ❌ No | ❌ No | |
| `id_group` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_specific_price_rule` | ❌ No | ❌ No | |
| `price` | ❌ No | ❌ No | |
| `from_quantity` | ❌ No | ❌ No | |
| `reduction` | ❌ No | ❌ No | |
| `reduction_tax` | ❌ No | ❌ No | |
| `reduction_type` | ❌ No | ❌ No | |
| `from` | ❌ No | ❌ No | |
| `to` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="specific_price_rule"></a>/specific_price_rules (`specific_price_rule`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_country` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `id_group` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `from_quantity` | ❌ No | ❌ No | |
| `price` | ❌ No | ❌ No | |
| `reduction` | ❌ No | ❌ No | |
| `reduction_tax` | ❌ No | ❌ No | |
| `reduction_type` | ❌ No | ❌ No | |
| `from` | ❌ No | ❌ No | |
| `to` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="cart_rule"></a>/cart_rules (`cart_rule`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `date_from` | ❌ No | ❌ No | |
| `date_to` | ❌ No | ❌ No | |
| `description` | ❌ No | ❌ No | |
| `quantity` | ❌ No | ❌ No | |
| `quantity_per_user` | ❌ No | ❌ No | |
| `priority` | ❌ No | ❌ No | |
| `partial_use` | ❌ No | ❌ No | |
| `code` | ❌ No | ❌ No | |
| `minimum_amount` | ❌ No | ❌ No | |
| `minimum_amount_tax` | ❌ No | ❌ No | |
| `minimum_amount_currency` | ❌ No | ❌ No | |
| `minimum_amount_shipping` | ❌ No | ❌ No | |
| `country_restriction` | ❌ No | ❌ No | |
| `carrier_restriction` | ❌ No | ❌ No | |
| `group_restriction` | ❌ No | ❌ No | |
| `cart_rule_restriction` | ❌ No | ❌ No | |
| `product_restriction` | ❌ No | ❌ No | |
| `shop_restriction` | ❌ No | ❌ No | |
| `free_shipping` | ❌ No | ❌ No | |
| `reduction_percent` | ❌ No | ❌ No | |
| `reduction_amount` | ❌ No | ❌ No | |
| `reduction_tax` | ❌ No | ❌ No | |
| `reduction_currency` | ❌ No | ❌ No | |
| `reduction_product` | ❌ No | ❌ No | |
| `reduction_exclude_special` | ❌ No | ❌ No | |
| `gift_product` | ❌ No | ❌ No | |
| `gift_product_attribute` | ❌ No | ❌ No | |
| `highlight` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="product_supplier"></a>/product_suppliers (`product_supplier`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `id_product_attribute` | ❌ No | ❌ No | |
| `id_supplier` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `product_supplier_reference` | ❌ No | ❌ No | |
| `product_supplier_price_te` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="customization_field"></a>/product_customization_fields (`customization_field`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `type` | ❌ No | ❌ No | |
| `required` | ❌ No | ❌ No | |
| `is_module` | ❌ No | ❌ No | |
| `is_deleted` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="combination"></a>/combinations (`combination`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_product` | ❌ No | ❌ No | |
| `ean13` | ❌ No | ❌ No | |
| `isbn` | ❌ No | ❌ No | |
| `upc` | ❌ No | ❌ No | |
| `mpn` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `supplier_reference` | ❌ No | ❌ No | |
| `wholesale_price` | ❌ No | ❌ No | |
| `price` | ❌ No | ❌ No | |
| `ecotax` | ❌ No | ❌ No | |
| `weight` | ❌ No | ❌ No | |
| `unit_price_impact` | ❌ No | ❌ No | |
| `minimal_quantity` | ❌ No | ❌ No | |
| `low_stock_threshold` | ❌ No | ❌ No | |
| `low_stock_alert` | ❌ No | ❌ No | |
| `default_on` | ❌ No | ❌ No | |
| `available_date` | ❌ No | ❌ No | |
| `available_now` | ✅ Yes | ❌ No | |
| `available_later` | ✅ Yes | ❌ No | |

#### Associations

- **`product_option_values`**: Contains fields: `id`
- **`images`**: Contains fields: `id`

---

### <a name="product_feature_value"></a>/product_feature_values (`product_feature_value`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_feature` | ❌ No | ❌ No | |
| `custom` | ❌ No | ❌ No | |
| `value` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="product_feature"></a>/product_features (`product_feature`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="product_option_value"></a>/product_option_values (`product_option_value`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_attribute_group` | ❌ No | ❌ No | |
| `color` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="product_option"></a>/product_options (`product_option`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `is_color_group` | ❌ No | ❌ No | |
| `group_type` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `public_name` | ✅ Yes | ❌ No | |

#### Associations

- **`product_option_values`**: Contains fields: `id`

---

### <a name="tag"></a>/tags (`tag`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="image_types"></a>/images (`image_types`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `general` | ❌ No | ❌ No | |
| `products` | ❌ No | ❌ No | |
| `categories` | ❌ No | ❌ No | |
| `manufacturers` | ❌ No | ❌ No | |
| `suppliers` | ❌ No | ❌ No | |
| `stores` | ❌ No | ❌ No | |
| `customizations` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="attachment"></a>/attachments (`attachment`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `file` | ❌ No | ❌ No | |
| `file_name` | ❌ No | ❌ No | |
| `file_size` | ❌ No | ❌ No | |
| `mime` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `description` | ✅ Yes | ❌ No | |

#### Associations

- **`products`**: Contains fields: `id`

---

### <a name="product"></a>/products (`product`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_manufacturer` | ❌ No | ❌ No | |
| `id_supplier` | ❌ No | ❌ No | |
| `id_category_default` | ❌ No | ❌ No | |
| `new` | ❌ No | ❌ No | |
| `cache_default_attribute` | ❌ No | ❌ No | |
| `id_default_image` | ❌ No | ❌ No | |
| `id_default_combination` | ❌ No | ❌ No | |
| `id_tax_rules_group` | ❌ No | ❌ No | |
| `position_in_category` | ❌ No | ❌ No | |
| `type` | ❌ No | ❌ No | |
| `id_shop_default` | ❌ No | ❌ No | |
| `reference` | ❌ No | ❌ No | |
| `supplier_reference` | ❌ No | ❌ No | |
| `location` | ❌ No | ❌ No | |
| `width` | ❌ No | ❌ No | |
| `height` | ❌ No | ❌ No | |
| `depth` | ❌ No | ❌ No | |
| `weight` | ❌ No | ❌ No | |
| `quantity_discount` | ❌ No | ❌ No | |
| `ean13` | ❌ No | ❌ No | |
| `isbn` | ❌ No | ❌ No | |
| `upc` | ❌ No | ❌ No | |
| `mpn` | ❌ No | ❌ No | |
| `cache_is_pack` | ❌ No | ❌ No | |
| `cache_has_attachments` | ❌ No | ❌ No | |
| `is_virtual` | ❌ No | ❌ No | |
| `state` | ❌ No | ❌ No | |
| `additional_delivery_times` | ❌ No | ❌ No | |
| `delivery_in_stock` | ✅ Yes | ❌ No | |
| `delivery_out_stock` | ✅ Yes | ❌ No | |
| `product_type` | ❌ No | ❌ No | |
| `on_sale` | ❌ No | ❌ No | |
| `online_only` | ❌ No | ❌ No | |
| `ecotax` | ❌ No | ❌ No | |
| `minimal_quantity` | ❌ No | ❌ No | |
| `low_stock_threshold` | ❌ No | ❌ No | |
| `low_stock_alert` | ❌ No | ❌ No | |
| `price` | ❌ No | ❌ No | |
| `wholesale_price` | ❌ No | ❌ No | |
| `unity` | ❌ No | ❌ No | |
| `unit_price` | ❌ No | ❌ No | |
| `unit_price_ratio` | ❌ No | ❌ No | |
| `additional_shipping_cost` | ❌ No | ❌ No | |
| `customizable` | ❌ No | ❌ No | |
| `text_fields` | ❌ No | ❌ No | |
| `uploadable_files` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `redirect_type` | ❌ No | ❌ No | |
| `id_type_redirected` | ❌ No | ❌ No | |
| `available_for_order` | ❌ No | ❌ No | |
| `available_date` | ❌ No | ❌ No | |
| `show_condition` | ❌ No | ❌ No | |
| `condition` | ❌ No | ❌ No | |
| `show_price` | ❌ No | ❌ No | |
| `indexed` | ❌ No | ❌ No | |
| `visibility` | ❌ No | ❌ No | |
| `advanced_stock_management` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `pack_stock_type` | ❌ No | ❌ No | |
| `meta_description` | ✅ Yes | ❌ No | |
| `meta_keywords` | ✅ Yes | ❌ No | |
| `meta_title` | ✅ Yes | ❌ No | |
| `link_rewrite` | ✅ Yes | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `description` | ✅ Yes | ❌ No | |
| `description_short` | ✅ Yes | ❌ No | |
| `available_now` | ✅ Yes | ❌ No | |
| `available_later` | ✅ Yes | ❌ No | |

#### Associations

- **`categories`**: Contains fields: `id`
- **`images`**: Contains fields: `id`
- **`combinations`**: Contains fields: `id`
- **`product_option_values`**: Contains fields: `id`
- **`product_features`**: Contains fields: `id`, `id_feature_value`
- **`tags`**: Contains fields: `id`
- **`stock_availables`**: Contains fields: `id`, `id_product_attribute`
- **`attachments`**: Contains fields: `id`
- **`accessories`**: Contains fields: `id`
- **`product_bundle`**: Contains fields: `id`, `id_product_attribute`, `quantity`

---

### <a name="manufacturer"></a>/manufacturers (`manufacturer`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `description` | ✅ Yes | ❌ No | |
| `short_description` | ✅ Yes | ❌ No | |
| `meta_title` | ✅ Yes | ❌ No | |
| `meta_description` | ✅ Yes | ❌ No | |
| `meta_keywords` | ✅ Yes | ❌ No | |

#### Associations

- **`addresses`**: Contains fields: `id`

---

### <a name="supplier"></a>/suppliers (`supplier`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `link_rewrite` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `description` | ✅ Yes | ❌ No | |
| `meta_title` | ✅ Yes | ❌ No | |
| `meta_description` | ✅ Yes | ❌ No | |
| `meta_keywords` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="category"></a>/categories (`category`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_parent` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `id_shop_default` | ❌ No | ❌ No | |
| `is_root_category` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `link_rewrite` | ✅ Yes | ❌ No | |
| `description` | ✅ Yes | ❌ No | |
| `additional_description` | ✅ Yes | ❌ No | |
| `meta_title` | ✅ Yes | ❌ No | |
| `meta_description` | ✅ Yes | ❌ No | |
| `meta_keywords` | ✅ Yes | ❌ No | |

#### Associations

- **`categories`**: Contains fields: `id`
- **`products`**: Contains fields: `id`

---

### <a name="content"></a>/content_management_system (`content`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_cms_category` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `indexation` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `meta_description` | ✅ Yes | ❌ No | |
| `meta_keywords` | ✅ Yes | ❌ No | |
| `meta_title` | ✅ Yes | ❌ No | |
| `head_seo_title` | ✅ Yes | ❌ No | |
| `link_rewrite` | ✅ Yes | ❌ No | |
| `content` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="guest"></a>/guests (`guest`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_customer` | ❌ No | ❌ No | |
| `id_operating_system` | ❌ No | ❌ No | |
| `id_web_browser` | ❌ No | ❌ No | |
| `javascript` | ❌ No | ❌ No | |
| `screen_resolution_x` | ❌ No | ❌ No | |
| `screen_resolution_y` | ❌ No | ❌ No | |
| `screen_color` | ❌ No | ❌ No | |
| `sun_java` | ❌ No | ❌ No | |
| `adobe_flash` | ❌ No | ❌ No | |
| `adobe_director` | ❌ No | ❌ No | |
| `apple_quicktime` | ❌ No | ❌ No | |
| `real_player` | ❌ No | ❌ No | |
| `windows_media` | ❌ No | ❌ No | |
| `accept_language` | ❌ No | ❌ No | |
| `mobile_theme` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="customer"></a>/customers (`customer`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_default_group` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `newsletter_date_add` | ❌ No | ❌ No | |
| `ip_registration_newsletter` | ❌ No | ❌ No | |
| `last_passwd_gen` | ❌ No | ❌ No | |
| `secure_key` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `passwd` | ❌ No | ❌ No | |
| `lastname` | ❌ No | ❌ No | |
| `firstname` | ❌ No | ❌ No | |
| `email` | ❌ No | ❌ No | |
| `id_gender` | ❌ No | ❌ No | |
| `birthday` | ❌ No | ❌ No | |
| `newsletter` | ❌ No | ❌ No | |
| `optin` | ❌ No | ❌ No | |
| `website` | ❌ No | ❌ No | |
| `company` | ❌ No | ❌ No | |
| `siret` | ❌ No | ❌ No | |
| `ape` | ❌ No | ❌ No | |
| `outstanding_allow_amount` | ❌ No | ❌ No | |
| `show_public_prices` | ❌ No | ❌ No | |
| `id_risk` | ❌ No | ❌ No | |
| `max_payment_days` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `note` | ❌ No | ❌ No | |
| `is_guest` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `reset_password_token` | ❌ No | ❌ No | |
| `reset_password_validity` | ❌ No | ❌ No | |

#### Associations

- **`groups`**: Contains fields: `id`

---

### <a name="carrier"></a>/carriers (`carrier`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `is_module` | ❌ No | ❌ No | |
| `id_tax_rules_group` | ❌ No | ❌ No | |
| `id_reference` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `is_free` | ❌ No | ❌ No | |
| `url` | ❌ No | ❌ No | |
| `shipping_handling` | ❌ No | ❌ No | |
| `shipping_external` | ❌ No | ❌ No | |
| `range_behavior` | ❌ No | ❌ No | |
| `shipping_method` | ❌ No | ❌ No | |
| `max_width` | ❌ No | ❌ No | |
| `max_height` | ❌ No | ❌ No | |
| `max_depth` | ❌ No | ❌ No | |
| `max_weight` | ❌ No | ❌ No | |
| `grade` | ❌ No | ❌ No | |
| `external_module_name` | ❌ No | ❌ No | |
| `need_range` | ❌ No | ❌ No | |
| `position` | ❌ No | ❌ No | |
| `delay` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="configuration"></a>/configurations (`configuration`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `value` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="contact"></a>/contacts (`contact`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `email` | ❌ No | ❌ No | |
| `customer_service` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `description` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="country"></a>/countries (`country`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_zone` | ❌ No | ❌ No | |
| `id_currency` | ❌ No | ❌ No | |
| `call_prefix` | ❌ No | ❌ No | |
| `iso_code` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `contains_states` | ❌ No | ❌ No | |
| `need_identification_number` | ❌ No | ❌ No | |
| `need_zip_code` | ❌ No | ❌ No | |
| `zip_code_format` | ❌ No | ❌ No | |
| `display_tax_label` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="currency"></a>/currencies (`currency`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `names` | ✅ Yes | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `symbol` | ✅ Yes | ❌ No | |
| `iso_code` | ❌ No | ❌ No | |
| `numeric_iso_code` | ❌ No | ❌ No | |
| `precision` | ❌ No | ❌ No | |
| `conversion_rate` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `unofficial` | ❌ No | ❌ No | |
| `modified` | ❌ No | ❌ No | |
| `pattern` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="employee"></a>/employees (`employee`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_lang` | ❌ No | ❌ No | |
| `last_passwd_gen` | ❌ No | ❌ No | |
| `stats_date_from` | ❌ No | ❌ No | |
| `stats_date_to` | ❌ No | ❌ No | |
| `stats_compare_from` | ❌ No | ❌ No | |
| `stats_compare_to` | ❌ No | ❌ No | |
| `passwd` | ❌ No | ❌ No | |
| `lastname` | ❌ No | ❌ No | |
| `firstname` | ❌ No | ❌ No | |
| `email` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `id_profile` | ❌ No | ❌ No | |
| `bo_color` | ❌ No | ❌ No | |
| `default_tab` | ❌ No | ❌ No | |
| `bo_theme` | ❌ No | ❌ No | |
| `bo_css` | ❌ No | ❌ No | |
| `bo_width` | ❌ No | ❌ No | |
| `bo_menu` | ❌ No | ❌ No | |
| `stats_compare_option` | ❌ No | ❌ No | |
| `preselect_date_range` | ❌ No | ❌ No | |
| `id_last_order` | ❌ No | ❌ No | |
| `id_last_customer_message` | ❌ No | ❌ No | |
| `id_last_customer` | ❌ No | ❌ No | |
| `reset_password_token` | ❌ No | ❌ No | |
| `reset_password_validity` | ❌ No | ❌ No | |
| `has_enabled_gravatar` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="group"></a>/groups (`group`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `reduction` | ❌ No | ❌ No | |
| `price_display_method` | ❌ No | ❌ No | |
| `show_prices` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="image_type"></a>/image_types (`image_type`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `width` | ❌ No | ❌ No | |
| `height` | ❌ No | ❌ No | |
| `categories` | ❌ No | ❌ No | |
| `products` | ❌ No | ❌ No | |
| `manufacturers` | ❌ No | ❌ No | |
| `suppliers` | ❌ No | ❌ No | |
| `stores` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="language"></a>/languages (`language`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `iso_code` | ❌ No | ❌ No | |
| `locale` | ❌ No | ❌ No | |
| `language_code` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `is_rtl` | ❌ No | ❌ No | |
| `date_format_lite` | ❌ No | ❌ No | |
| `date_format_full` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="order_state"></a>/order_states (`order_state`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `unremovable` | ❌ No | ❌ No | |
| `delivery` | ❌ No | ❌ No | |
| `hidden` | ❌ No | ❌ No | |
| `send_email` | ❌ No | ❌ No | |
| `module_name` | ❌ No | ❌ No | |
| `invoice` | ❌ No | ❌ No | |
| `color` | ❌ No | ❌ No | |
| `logable` | ❌ No | ❌ No | |
| `shipped` | ❌ No | ❌ No | |
| `paid` | ❌ No | ❌ No | |
| `pdf_delivery` | ❌ No | ❌ No | |
| `pdf_invoice` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `template` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="price_range"></a>/price_ranges (`price_range`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `delimiter1` | ❌ No | ❌ No | |
| `delimiter2` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="shop_group"></a>/shop_groups (`shop_group`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `color` | ❌ No | ❌ No | |
| `share_customer` | ❌ No | ❌ No | |
| `share_order` | ❌ No | ❌ No | |
| `share_stock` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="shop_url"></a>/shop_urls (`shop_url`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `main` | ❌ No | ❌ No | |
| `domain` | ❌ No | ❌ No | |
| `domain_ssl` | ❌ No | ❌ No | |
| `physical_uri` | ❌ No | ❌ No | |
| `virtual_uri` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="shop"></a>/shops (`shop`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_category` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `color` | ❌ No | ❌ No | |
| `theme_name` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="state"></a>/states (`state`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_zone` | ❌ No | ❌ No | |
| `id_country` | ❌ No | ❌ No | |
| `iso_code` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="stock_movement_reason"></a>/stock_movement_reasons (`stock_movement_reason`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `sign` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="store"></a>/stores (`store`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_country` | ❌ No | ❌ No | |
| `id_state` | ❌ No | ❌ No | |
| `hours` | ✅ Yes | ❌ No | |
| `postcode` | ❌ No | ❌ No | |
| `city` | ❌ No | ❌ No | |
| `latitude` | ❌ No | ❌ No | |
| `longitude` | ❌ No | ❌ No | |
| `phone` | ❌ No | ❌ No | |
| `fax` | ❌ No | ❌ No | |
| `email` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |
| `address1` | ✅ Yes | ❌ No | |
| `address2` | ✅ Yes | ❌ No | |
| `note` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="supply_order_state"></a>/supply_order_states (`supply_order_state`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `delivery_note` | ❌ No | ❌ No | |
| `editable` | ❌ No | ❌ No | |
| `receipt_state` | ❌ No | ❌ No | |
| `pending_receipt` | ❌ No | ❌ No | |
| `enclosed` | ❌ No | ❌ No | |
| `color` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="tax_rule_group"></a>/tax_rule_groups (`tax_rule_group`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="tax_rule"></a>/tax_rules (`tax_rule`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_tax_rules_group` | ❌ No | ❌ No | |
| `id_state` | ❌ No | ❌ No | |
| `id_country` | ❌ No | ❌ No | |
| `zipcode_from` | ❌ No | ❌ No | |
| `zipcode_to` | ❌ No | ❌ No | |
| `id_tax` | ❌ No | ❌ No | |
| `behavior` | ❌ No | ❌ No | |
| `description` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="tax"></a>/taxes (`tax`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `rate` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |
| `deleted` | ❌ No | ❌ No | |
| `name` | ✅ Yes | ❌ No | |

*No associations defined for this model.*

---

### <a name="translated_configuration"></a>/translated_configurations (`translated_configuration`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `value` | ✅ Yes | ❌ No | |
| `date_add` | ❌ No | ❌ No | |
| `date_upd` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `id_shop_group` | ❌ No | ❌ No | |
| `id_shop` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="weight_range"></a>/weight_ranges (`weight_range`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `id_carrier` | ❌ No | ❌ No | |
| `delimiter1` | ❌ No | ❌ No | |
| `delimiter2` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

### <a name="zone"></a>/zones (`zone`)

#### Fields / Columns

| Field Name | Multilingual | Required | Description / Notes |
|---|---|---|---|
| `id` | ❌ No | ❌ No | |
| `name` | ❌ No | ❌ No | |
| `active` | ❌ No | ❌ No | |

*No associations defined for this model.*

---

