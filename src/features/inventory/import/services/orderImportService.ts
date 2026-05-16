import Papa from "papaparse";
import apiService from "@shared/api/api-service";
import { productMap } from "./productImportService";
import { combinationMap } from "./combinationImportService";
import type { OrderCSVRow, AchatTuple, ResolvedTuple, Customer, Address, Cart, CartRow, Order, CarrierPost, LValue } from "@shared/types/import";

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
    "en cours de préparation": 3,
    "expédié": 4,
    "livré": 5,
    "annulé": 6,
    "remboursé": 7,
};

function formatDate(raw: string): string {
    if (!raw || !raw.includes("/")) return raw;
    const parts = raw.trim().split("/");
    if (parts.length !== 3) return raw;
    return `${parts[2]}-${parts[1]}-${parts[0]} 00:00:00`;
}

function parseAchat(raw: string): AchatTuple[] {
    const results: AchatTuple[] = [];
    if (!raw) return results;
    const regex = /\("([^"]+)";(\d+);"([^"]*)"\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(raw)) !== null) {
        results.push({
            ref: match[1].trim(),
            qty: parseInt(match[2], 10),
            valeur: match[3].trim(),
        });
    }
    return results;
}

/**
 * Sérialisation PHP robuste pour delivery_option
 * Utilise TextEncoder pour la longueur des chaînes (compatible navigateur)
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
        const first = Array.isArray(carrier) ? carrier[0] : carrier;
        const id = parseInt(first?.id, 10);
        if (!isNaN(id) && id > 0) {
            console.log(`Default carrier id: ${id}`);
            return id;
        }
    } catch (err) {
        console.error("Cannot fetch carriers:", err);
    }
    // Fallback : création d'un transporteur par défaut si aucun n'existe
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
    return 1; // dernier recours
}

export async function importOrders(csvFile: File): Promise<void> {
    // Repartir de zéro à chaque import (les maps sont des singletons de module).
    customerMap.clear();
    addressMap.clear();
    orderCountMap.clear();
    const text = await csvFile.text();
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ",",
            complete: async (results) => {
                try {
                    const metaFields = (results.meta.fields || []).map((f) => f.trim().replace(/^\uFEFF/, ""));
                    const required = ["date", "nom", "email", "pwd", "adresse", "achat"];
                    for (const col of required) {
                        if (!metaFields.includes(col)) {
                            throw new Error(`VALIDATION_ERROR: Missing required column: ${col}`);
                        }
                    }
                    const rows: OrderCSVRow[] = results.data.map((row: any) => ({
                        date: (row["date"] ?? "").trim(),
                        nom: (row["nom"] ?? "").trim(),
                        email: (row["email"] ?? "").trim(),
                        pwd: (row["pwd"] ?? "").trim(),
                        adresse: (row["adresse"] ?? "").trim(),
                        achat: (row["achat"] ?? "").trim(),
                        etat: (row["etat"] ?? "").trim(),
                    }));
                    console.log("Parsed order rows:", rows);
                    const id_carrier = await getDefaultCarrierId();
                    for (const row of rows) {
                        await processOrderRow(row, id_carrier);
                    }
                    resolve();
                } catch (err) {
                    console.error("Order import error:", err);
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
        // Pas d'associations à la création : un <cart_rows> vide fait générer à
        // PrestaShop un « INSERT ... VALUES » sans ligne (erreur SQL). Les produits
        // sont ajoutés ensuite via le PUT plus bas.
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
        if (!productData) continue;

        let id_product_attribute = 0;
        let unit_price_ttc = productData.prix_ttc;
        let rate = productData.rate;

        if (tuple.valeur) {
            const comboKey = `${tuple.ref}-${tuple.valeur}`;
            const combo = combinationMap.get(comboKey);
            if (combo) {
                id_product_attribute = combo.id;
                unit_price_ttc = combo.prix_ttc;
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
    
    if (isNaN(total_paid) || total_paid <= 0) {
        console.error(`Invalid total_paid for ${email}: ${total_paid} — check productMap prices`);
        return;
    }
    const dateFormatted = formatDate(date);

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
            current_state: STATUS_MAP[etat.toLowerCase()] || 2,
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

        console.log("ORDER Data envoyée :", orderData);

        const res = await apiService.post<any>("/orders", { order: orderData });
        const id = res?.prestashop?.order?.id;
        if (!id) throw new Error("No order id returned");
        const id_order = parseInt(id, 10);
        orderCountMap.set(id_order, true);
        console.log(`Order created: ${id_order}`);

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
        console.error("ORDER ERROR:");
        if (err.response) {
            console.error("STATUS:", err.response.status);
            console.error("DATA:", err.response.data);
        } else {
            console.error(err);
        }
    }
}
