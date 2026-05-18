import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService";
import { combinationMap } from "./combinationImportService";
import type { OrderCSVRow, AchatTuple, ResolvedTuple, Customer, Address, Cart, CartRow, Order, CarrierPost, LValue, StockMovement } from "@shared/types/import";
import { ImportValidator } from "@shared/utils/import-validator";
import { extractIdValue } from "@shared/utils/extractIdValue";
import { ensureArray } from '@shared/utils/arrayUtils';

export const customerMap = new Map<string, number>();
export const addressMap = new Map<string, number>();
export const orderCountMap = new Map<number, true>();

const toLValue = (text: string): LValue => ({
    language: {
        '@_id': 1,
        '#text': text
    }
});

const STATUS_MAP: Record<string, number> = {
    "paiement accepté": 2,
    "livré": 5,
    "annulé": 6,
};

function formatDate(raw: string): string {
    return ImportValidator.validateDateFormat(raw, 'date');
}

function parseAchat(raw: string): AchatTuple[] {
    const results: AchatTuple[] = [];
    if (!raw) return results;
    const regex = /\("([^"]+)";(\d+);"([^"]*)"\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
        results.push({
            ref: match[1].trim(),
            qty: ImportValidator.validatePositiveAmount(match[2], 'quantité achat'),
            valeur: match[3].trim(),
        });
    }
    return results;
}

/**
 * Sérialisation PHP robuste pour delivery_option
 */
function phpSerializeArray(obj: Record<string, string>): string {
    const entries = Object.entries(obj);
    const inner = entries.map(([key, value]) => {
        const serializedKey = `i:${key};`;
        const byteLength = new TextEncoder().encode(value).length;
        const serializedValue = `s:${byteLength}:"${value}";`;
        return serializedKey + serializedValue;
    }).join('');
    return `a:${entries.length}:{${inner}}`;
}

async function getDefaultCarrierId(): Promise<number> {
    try {
        const res = await apiService.get<any>("/carriers?display=full&filter[active]=1&filter[deleted]=0");
        const carrier = res?.prestashop?.carriers?.carrier;
        const first = ensureArray(carrier)[0];
        const id = parseInt(first?.id, 10);
        if (!isNaN(id) && id > 0) {
            console.log(`Default carrier id: ${id}`);
            return id;
        }
    } catch (err) {
        console.error("Cannot fetch carriers:", err);
    }
    // Fallback
    try {
        const carrierData: CarrierPost = {
            name: 'Default carrier',
            active: 1,
            deleted: 0,
            is_free: 0,
            shipping_handling: 1,
            shipping_external: 0,
            range_behavior: 0,
            shipping_method: 0,
            max_width: 0,
            max_height: 0,
            max_depth: 0,
            max_weight: 0,
            grade: 0,
            delay: toLValue('Delivery within 3-5 days'),
        };
        const res = await apiService.post<any>("/carriers", { carrier: carrierData });
        const newId = res?.prestashop?.carrier?.id;
        if (newId) return parseInt(newId, 10);
    } catch (err) {
        console.error("Cannot create fallback carrier:", err);
    }
    return 1;
}

export async function importOrders(csvFile: File): Promise<void> {
    customerMap.clear();
    addressMap.clear();
    orderCountMap.clear();
    const text = await csvFile.text();
    return new Promise((resolve, reject) => {
        Papa.parse<any>(text, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    const metaFields = (results.meta.fields || []).map((f) => f.trim().replace(/^\uFEFF/, ""));
                    const required = ["date", "nom", "email", "pwd", "adresse", "achat", "etat"];

                    // 1. Validation des colonnes (insensible à la casse)
                    const colMap = ImportValidator.validateColumns(metaFields, required);

                    const rows: OrderCSVRow[] = results.data.map((row: any) => {
                        const dateVal = row[colMap['date']];
                        
                        // 2. Validation format date
                        ImportValidator.validateDateFormat(dateVal, 'date');

                        return {
                            date: (dateVal || "").trim(),
                            nom: (row[colMap['nom']] || "").trim(),
                            email: (row[colMap['email']] || "").trim(),
                            pwd: (row[colMap['pwd']] || "").trim(),
                            adresse: (row[colMap['adresse']] || "").trim(),
                            achat: (row[colMap['achat']] || "").trim(),
                            etat: (row[colMap['etat']] || "").trim(),
                        };
                    });

                    console.log("Parsed orders:", rows);
                    const id_carrier = await getDefaultCarrierId();
                    for (const row of rows) {
                        await processOrderRow(row, id_carrier);
                    }
                    resolve();
                } catch (err) {
                    console.error("Order import failed validation:", err);
                    reject(err);
                }
            },
            error: (err: any) => reject(err),
        });
    });
}

async function processOrderRow(row: OrderCSVRow, id_carrier: number): Promise<void> {
    const { date, nom, email, pwd, adresse, achat, etat } = row;
    const tuples = parseAchat(achat);
    if (tuples.length === 0) {
        console.warn(`Cannot parse achat for ${email}`);
        return;
    }
    for (const t of tuples) {
        if (!productMap.has(t.ref)) {
            console.warn(`Missing product ref "${t.ref}"`);
            return;
        }
    }

    // ========== CUSTOMER ==========
    let id_customer = customerMap.get(email);
    if (!id_customer) {
        try {
            const customerData: Customer = {
                firstname: 'Client',
                lastname: nom,
                email: email,
                passwd: pwd,
                active: 1,
                id_default_group: 3
            };
            const res = await apiService.post<any>("/customers", { customer: customerData });
            const id = res?.prestashop?.customer?.id;
            if (!id) throw new Error("No customer id");
            id_customer = parseInt(id, 10);
            customerMap.set(email, id_customer);
            console.log(`Customer created: ${email} → ${id_customer}`);
        } catch (err) {
            console.error(`Customer creation error:`, err);
            return;
        }
    }

    // ========== ADDRESS ==========
    const addressKey = `${id_customer}::${adresse}`;
    let id_address = addressMap.get(addressKey);
    if (!id_address) {
        try {
            const addressData: Address = {
                id_customer: id_customer,
                id_country: 8,
                firstname: 'Client',
                lastname: nom,
                address1: adresse,
                city: 'Antananarivo',
                alias: 'Adresse principale'
            };
            const res = await apiService.post<any>("/addresses", { address: addressData });
            const id = res?.prestashop?.address?.id;
            if (!id) throw new Error("No address id");
            id_address = parseInt(id, 10);
            addressMap.set(addressKey, id_address);
            console.log(`Address created: ${id_address}`);
        } catch (err) {
            console.error(`Address creation error:`, err);
            return;
        }
    }

    // ========== CART CREATE ==========
    let id_cart: number;
    let secureKey = "";
    try {
        const cartData: Cart = {
            id_customer: id_customer,
            id_address_delivery: id_address,
            id_address_invoice: id_address,
            id_currency: 1,
            id_lang: 1,
            id_carrier: id_carrier,
            id_shop: 1,
            id_shop_group: 1,
            secure_key: '',
            date_add: formatDate(date),
        };
        const res = await apiService.post<any>("/carts", { cart: cartData });
        const id = res?.prestashop?.cart?.id;
        if (!id) throw new Error("No cart id");
        id_cart = parseInt(id, 10);
        secureKey = res?.prestashop?.cart?.secure_key || "";
        console.log(`Cart created: ${id_cart}`);
    } catch (err) {
        console.error(`Cart creation error:`, err);
        return;
    }

    if (!secureKey) {
        try {
            const res = await apiService.get<any>(`/carts/${id_cart}?display=full`);
            secureKey = res?.prestashop?.cart?.secure_key;
            if (!secureKey) throw new Error("Missing secure key");
        } catch (err) {
            console.error(`Cannot get secure key:`, err);
            return;
        }
    }

    // ========== RESOLVE PRODUCTS ==========
    const resolvedTuples: ResolvedTuple[] = [];
    for (const tuple of tuples) {
        const productData = productMap.get(tuple.ref);
        if (!productData) {
            console.warn(`[orderImport] Product not found for ref: ${tuple.ref}.`);
            continue;
        }

        let id_product_attribute = 0;
        let unit_price_ttc = productData.prix_ttc;
        let rate = productData.rate;

        if (tuple.valeur) {
            const prefix = `${tuple.ref}_`;
            const suffix = `_${tuple.valeur}`;
            
            let foundEntry = null;
            for (const [key, value] of combinationMap.entries()) {
                if (key.startsWith(prefix) && key.endsWith(suffix)) {
                    foundEntry = value;
                    break;
                }
            }

            if (foundEntry) {
                id_product_attribute = foundEntry.id;
                unit_price_ttc = foundEntry.prix_ttc;
            } else {
                console.warn(`[orderImport] Combination not found for ref: ${tuple.ref}, valeur: ${tuple.valeur}.`);
            }
        }

        resolvedTuples.push({
            id_product: productData.id_product,
            id_product_attribute,
            qty: tuple.qty,
            unit_price_ttc,
            rate,
        });
    }
    if (resolvedTuples.length === 0) {
        console.warn(`No valid products for ${email}`);
        return;
    }

    // ========== UPDATE CART WITH PRODUCTS AND DELIVERY OPTION ==========
    try {
        const carrierPart = `${id_carrier},`;
        const deliveryOptionObj = { [id_address]: carrierPart };
        const phpSerialized = phpSerializeArray(deliveryOptionObj);

        const cartRows: CartRow[] = resolvedTuples.map(t => ({
            id_product: t.id_product,
            id_product_attribute: t.id_product_attribute,
            id_address_delivery: id_address,
            quantity: t.qty
        }));

        const cartUpdate: any = {
            id: id_cart,
            id_customer: id_customer,
            id_address_delivery: id_address,
            id_address_invoice: id_address,
            id_currency: 1,
            id_lang: 1,
            id_carrier: id_carrier,
            id_shop: 1,
            id_shop_group: 1,
            secure_key: secureKey,
            date_add: formatDate(date),
            delivery_option: phpSerialized,
            associations: {
                cart_rows: {
                    cart_row: cartRows
                }
            }
        };

        await apiService.put(`/carts/${id_cart}`, { cart: cartUpdate });
        console.log("Cart updated with products and delivery option");
    } catch (err) {
        console.error("Error updating cart:", err);
        return;
    }

    if (!etat || etat.trim() === "dans le panier") {
        console.log(`État vide pour ${email} → panier ${id_cart} créé, aucune commande.`);
        return;
    }

    // ========== CALCUL DES TOTAUX ==========
    let total_products_wt = 0; // TTC
    let total_products = 0;    // HT
    for (const t of resolvedTuples) {
        const unit_ht = t.unit_price_ttc / (1 + t.rate / 100);
        total_products_wt += t.unit_price_ttc * t.qty;
        total_products += unit_ht * t.qty;
    }
    const total_shipping = 0;
    const total_paid = total_products_wt + total_shipping;
    
    const dateFormatted = formatDate(date);

    // Résolution de l'état
    const initialStateId = STATUS_MAP[etat] || 11;

    // ========== ORDER CREATE ==========
    try {
        const orderData: Order = {
            id_shop: 1,
            id_shop_group: 1,
            id_cart: id_cart,
            id_customer: id_customer,
            id_address_delivery: id_address,
            id_address_invoice: id_address,
            id_currency: 1,
            id_lang: 1,
            id_carrier: id_carrier,
            module: 'ps_checkpayment',
            payment: 'Check payment',
            secure_key: secureKey,
            conversion_rate: 1,
            total_products: parseFloat(total_products.toFixed(6)),
            total_products_wt: parseFloat(total_products_wt.toFixed(6)),
            total_paid: parseFloat(total_paid.toFixed(6)),
            total_paid_real: parseFloat(total_paid.toFixed(6)),
            total_paid_tax_incl: parseFloat(total_paid.toFixed(6)),
            total_paid_tax_excl: parseFloat(total_products.toFixed(6)),
            current_state: initialStateId,
            date_add: dateFormatted,
            associations: {
                order_rows: {
                    order_row: resolvedTuples.map(t => ({
                        product_id: t.id_product,
                        product_attribute_id: t.id_product_attribute,
                        product_quantity: t.qty
                    }))
                }
            }
        };

        const res = await apiService.post<any>("/orders", { order: orderData });
        const id = res?.prestashop?.order?.id;
        if (!id) throw new Error("No order id returned");
        const id_order = parseInt(id, 10);
        orderCountMap.set(id_order, true);
        console.log(`Order created: ${id_order}`);

        if(initialStateId === 5) {

            // ========== STOCK MOVEMENT ==========
            for (const t of resolvedTuples) {
                try {
                    const stockGetRes: any = await apiService.get(`/stock_availables?filter[id_product]=${t.id_product}&filter[id_product_attribute]=${t.id_product_attribute}&display=[id]`);
                    const stockAvailable = stockGetRes?.prestashop?.stock_availables?.stock_available;
                    const idStockAvailable = ensureArray(stockAvailable)[0]?.id;

                    if (idStockAvailable) {
                        const stockMovementPayload: StockMovement = {
                            id_employee: 1,
                            id_stock: Number(extractIdValue(idStockAvailable)),
                            physical_quantity: t.qty,
                            sign: -1,
                            id_stock_mvt_reason: 3,
                            price_te: 0,
                            date_add: dateFormatted,
                        };

                        await apiService.post('/stock_movements', {
                            stock_mvt: stockMovementPayload
                        });
                        console.log(`Created stock movement for order ${id_order}, product ${t.id_product}`);
                    }
                } catch (mvtError) {
                    console.error(`Failed to create stock movement for order ${id_order}, product ${t.id_product}`, mvtError);
                }
            }
        }

        try {
            const orderPut: any = { ...orderData, id: id_order };
            delete orderPut.associations;
            await apiService.put(`/orders/${id_order}`, { order: orderPut });
            console.log(`Order date set to ${dateFormatted} for ${id_order}`);
        } catch (e) {
            console.warn(`Could not set order date for ${id_order}`, e);
        }

        // ========== ORDER STATE UPDATE ==========
        const historyData = {
            order_history: {
                id_order: id_order,
                id_order_state: orderData.current_state,
                date_add: dateFormatted
            }
        };
        await apiService.post("/order_histories", historyData);
        console.log(`Order history added for ${id_order}`);
        
    } catch (err: any) {
        console.error("ORDER ERROR:", err);
    }
}
