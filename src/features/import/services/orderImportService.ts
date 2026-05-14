import Papa from "papaparse";
import apiService from "../../../shared/services/api-service";
import { productMap } from "./productImportService";
import { combinationMap } from "./combinationImportService";

export const customerMap = new Map<string, number>();
export const addressMap = new Map<string, number>();
export const orderCountMap = new Map<number, true>();

const STATUS_MAP: Record<string, number> = {
    "paiement accepté": 2,
    "en cours de préparation": 3,
    "expédié": 4,
    "livré": 5,
    "annulé": 6,
    "remboursé": 7,
};

interface OrderCSVRow {
    date: string;
    nom: string;
    email: string;
    pwd: string;
    adresse: string;
    achat: string;
    etat: string;
}

interface AchatTuple {
    ref: string;
    qty: number;
    valeur: string;
}

interface ResolvedTuple {
    id_product: number;
    id_product_attribute: number;
    qty: number;
    unit_price_ttc: number;
    rate: number;
}

function formatDate(raw: string): string {
    if (!raw || !raw.includes("/")) return raw;
    const parts = raw.trim().split("/");
    if (parts.length !== 3) return raw;
    return `${parts[2]}-${parts[1]}-${parts[0]} 00:00:00`;
}

function toFixed6(n: number): string {
    return n.toFixed(6);
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

async function getDefaultCarrierId(): Promise<number> {
    try {
        const res = await apiService.get<any>(
            "/carriers?display=full&filter[active]=1&filter[deleted]=0"
        );
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
    return 1;
}

export async function importOrders(csvFile: File): Promise<void> {
    const text = await csvFile.text();
    return new Promise((resolve, reject) => {
        Papa.parse<Record<string, string>>(text, {
            header: true,
            skipEmptyLines: true,
            delimiter: ",",
            complete: async (results) => {
                try {
                    const metaFields = (results.meta.fields || []).map((f) =>
                        f.trim().replace(/^\uFEFF/, "")
                    );
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

    // =========================================================
    // CUSTOMER
    // =========================================================
    let id_customer = customerMap.get(email);
    if (!id_customer) {
        try {
            const xml = `
<prestashop>
    <customer>
        <firstname><![CDATA[Client]]></firstname>
        <lastname><![CDATA[${nom}]]></lastname>
        <email><![CDATA[${email}]]></email>
        <passwd><![CDATA[${pwd}]]></passwd>
        <active>1</active>
        <id_lang>1</id_lang>
        <id_default_group>3</id_default_group>
        <id_gender>0</id_gender>
        <is_guest>0</is_guest>
        <newsletter>0</newsletter>
        <optin>0</optin>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
    </customer>
</prestashop>`;
            const res = await apiService.post<any>("/customers", xml);
            const id = res?.prestashop?.customer?.id;
            if (!id) throw new Error("No customer id");
            id_customer = parseInt(id, 10);
            customerMap.set(email, id_customer);
            console.log(`Customer created: ${email} → ${id_customer}`);
        } catch (err) {
            console.error(`Customer creation error:`, err);
            return;
        }
    } else {
        console.log(`Customer reused: ${email} → ${id_customer}`);
    }

    // =========================================================
    // ADDRESS
    // =========================================================
    const addressKey = `${id_customer}::${adresse}`;
    let id_address = addressMap.get(addressKey);
    if (!id_address) {
        try {
            const xml = `
<prestashop>
    <address>
        <id_customer>${id_customer}</id_customer>
        <id_country>1</id_country>
        <firstname><![CDATA[Client]]></firstname>
        <lastname><![CDATA[${nom}]]></lastname>
        <address1><![CDATA[${adresse}]]></address1>
        <city><![CDATA[Antananarivo]]></city>
        <postcode>101</postcode>
        <alias><![CDATA[Adresse principale]]></alias>
        <phone></phone>
        <phone_mobile></phone_mobile>
        <other></other>
        <vat_number></vat_number>
        <dni></dni>
        <id_state>0</id_state>
    </address>
</prestashop>`;
            const res = await apiService.post<any>("/addresses", xml);
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

    // =========================================================
    // CART CREATE
    // =========================================================
    let id_cart: number;
    try {
        const xml = `
<prestashop>
    <cart>
        <id_customer>${id_customer}</id_customer>
        <id_address_delivery>${id_address}</id_address_delivery>
        <id_address_invoice>${id_address}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_carrier>${id_carrier}</id_carrier>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <delivery_option></delivery_option>
        <gift>0</gift>
        <gift_message></gift_message>
        <recyclable>0</recyclable>
        <mobile_theme>0</mobile_theme>
    </cart>
</prestashop>`;
        const res = await apiService.post<any>("/carts", xml);
        const id = res?.prestashop?.cart?.id;
        if (!id) throw new Error("No cart id");
        id_cart = parseInt(id, 10);
        console.log(`Cart created: ${id_cart}`);
    } catch (err) {
        console.error(`Cart creation error:`, err);
        return;
    }

    // =========================================================
    // GET SECURE KEY
    // =========================================================
    let secureKey = "";
    try {
        const res = await apiService.get<any>(`/carts/${id_cart}?display=full`);
        secureKey = res?.prestashop?.cart?.secure_key;
        if (!secureKey) throw new Error("Missing secure key");
        console.log(`Cart secure key: ${secureKey}`);
    } catch (err) {
        console.error(`Cannot get secure key:`, err);
        return;
    }

    // =========================================================
    // RESOLVE PRODUCTS
    // =========================================================
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
        console.warn(`No valid products`);
        return;
    }

    // =========================================================
    // UPDATE CART WITH PRODUCTS (PUT /carts/{id})
    // =========================================================
    try {
        const cartRowsXml = resolvedTuples
            .map(
                (t) => `
<cart_row>
    <id_product>${t.id_product}</id_product>
    <id_product_attribute>${t.id_product_attribute}</id_product_attribute>
    <id_address_delivery>${id_address}</id_address_delivery>
    <id_currency>1</id_currency>
    <id_lang>1</id_lang>
    <quantity>${t.qty}</quantity>
</cart_row>`
            )
            .join("");

        const cartUpdateXml = `
<prestashop>
    <cart>
        <id>${id_cart}</id>
        <id_customer>${id_customer}</id_customer>
        <id_address_delivery>${id_address}</id_address_delivery>
        <id_address_invoice>${id_address}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_carrier>${id_carrier}</id_carrier>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <secure_key>${secureKey}</secure_key>
        <gift>0</gift>
        <gift_message></gift_message>
        <recyclable>0</recyclable>
        <mobile_theme>0</mobile_theme>
        <delivery_option></delivery_option>
        <associations>
            <cart_rows>
                ${cartRowsXml}
            </cart_rows>
        </associations>
    </cart>
</prestashop>`;

        console.log("Cart update XML:", cartUpdateXml);
        await apiService.put(`/carts/${id_cart}`, cartUpdateXml);
        console.log("Cart updated with products");
    } catch (err) {
        console.error("Error updating cart with products:", err);
        return;
    }

    // =========================================================
    // VERIFY CART CONTENT
    // =========================================================
    try {
        const checkRes = await apiService.get<any>(`/carts/${id_cart}?display=full`);
        const cartRows = checkRes?.prestashop?.cart?.associations?.cart_rows;
        const cartRow  = cartRows?.cart_row;
        console.log(`Cart ${id_cart} now has products:`, cartRow);
        if (!cartRow || (Array.isArray(cartRow) && cartRow.length === 0)) {
            console.error("Le panier est toujours vide après la mise à jour. Abandon.");
            return;
        }
    } catch (err) {
        console.error("Error verifying cart content:", err);
        return;
    }

    // =========================================================
    // SET DELIVERY OPTION (second PUT)
    // =========================================================
    try {
        const carrierPart = `${id_carrier},`;
        const phpSerialized = `a:1:{i:${id_address};s:${carrierPart.length}:"${carrierPart}";}`;

        const deliveryXml = `
<prestashop>
    <cart>
        <id>${id_cart}</id>
        <id_customer>${id_customer}</id_customer>
        <id_address_delivery>${id_address}</id_address_delivery>
        <id_address_invoice>${id_address}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_carrier>${id_carrier}</id_carrier>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <secure_key>${secureKey}</secure_key>
        <gift>0</gift>
        <gift_message></gift_message>
        <recyclable>0</recyclable>
        <mobile_theme>0</mobile_theme>
        <delivery_option><![CDATA[${phpSerialized}]]></delivery_option>
    </cart>
</prestashop>`;
        await apiService.put(`/carts/${id_cart}`, deliveryXml);
        console.log("Delivery option set");
    } catch (err) {
        console.error("Error setting delivery option:", err);
        return;
    }

    // =========================================================
    // CALCUL DES TOTAUX (local)
    // =========================================================
    let total_products_wt = 0; // TTC
    let total_products    = 0; // HT

    for (const t of resolvedTuples) {
        const unit_ht = t.unit_price_ttc / (1 + t.rate / 100);
        total_products_wt += t.unit_price_ttc * t.qty;
        total_products    += unit_ht * t.qty;
    }

    const total_shipping              = 0;
    const total_shipping_tax_excl     = 0;
    const total_shipping_tax_incl     = 0;
    const total_discounts             = 0;
    const total_discounts_tax_excl    = 0;
    const total_discounts_tax_incl    = 0;
    const total_wrapping              = 0;
    const total_wrapping_tax_excl     = 0;
    const total_wrapping_tax_incl     = 0;
    const total_paid                  = total_products_wt + total_shipping;
    const total_paid_tax_excl         = total_products + total_shipping_tax_excl;
    const total_paid_tax_incl         = total_paid;
    const total_paid_real             = total_paid;

    console.log(`Totaux calculés: total_paid=${total_paid.toFixed(2)}, total_products_wt=${total_products_wt.toFixed(2)}, total_products=${total_products.toFixed(2)}`);

    if (total_products_wt === 0) {
        console.error("Totaux nuls — prix manquant dans combinationMap ou productMap. Abandon.");
        return;
    }

    // =========================================================
    // MISE À JOUR DES TOTAUX DU PANIER (avec tous les champs obligatoires)
    // =========================================================
    try {
        const cartTotalsXml = `
<prestashop>
    <cart>
        <id>${id_cart}</id>
        <id_customer>${id_customer}</id_customer>
        <id_address_delivery>${id_address}</id_address_delivery>
        <id_address_invoice>${id_address}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_carrier>${id_carrier}</id_carrier>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <secure_key>${secureKey}</secure_key>
        <total_products>${toFixed6(total_products)}</total_products>
        <total_products_wt>${toFixed6(total_products_wt)}</total_products_wt>
        <total_shipping>${toFixed6(total_shipping)}</total_shipping>
        <total_shipping_tax_incl>${toFixed6(total_shipping_tax_incl)}</total_shipping_tax_incl>
        <total_shipping_tax_excl>${toFixed6(total_shipping_tax_excl)}</total_shipping_tax_excl>
        <total_discounts>${toFixed6(total_discounts)}</total_discounts>
        <total_discounts_tax_incl>${toFixed6(total_discounts_tax_incl)}</total_discounts_tax_incl>
        <total_discounts_tax_excl>${toFixed6(total_discounts_tax_excl)}</total_discounts_tax_excl>
        <total_wrapping>${toFixed6(total_wrapping)}</total_wrapping>
        <total_wrapping_tax_incl>${toFixed6(total_wrapping_tax_incl)}</total_wrapping_tax_incl>
        <total_wrapping_tax_excl>${toFixed6(total_wrapping_tax_excl)}</total_wrapping_tax_excl>
        <total_paid>${toFixed6(total_paid)}</total_paid>
        <total_paid_tax_incl>${toFixed6(total_paid_tax_incl)}</total_paid_tax_incl>
        <total_paid_tax_excl>${toFixed6(total_paid_tax_excl)}</total_paid_tax_excl>
        <total_paid_real>${toFixed6(total_paid_real)}</total_paid_real>
    </cart>
</prestashop>`;

        await apiService.put(`/carts/${id_cart}`, cartTotalsXml);
        console.log("Cart totals updated");
    } catch (err) {
        console.error("Error updating cart totals:", err);
        // On continue quand même, la commande peut parfois être acceptée
    }

    // =========================================================
    // ORDER CREATE
    // =========================================================
    const dateFormatted = formatDate(date);
    try {
        const orderXml = `
<prestashop>
    <order>
        <id_shop>1</id_shop>
        <id_shop_group>1</id_shop_group>
        <id_cart>${id_cart}</id_cart>
        <id_customer>${id_customer}</id_customer>
        <id_address_delivery>${id_address}</id_address_delivery>
        <id_address_invoice>${id_address}</id_address_invoice>
        <id_currency>1</id_currency>
        <id_lang>1</id_lang>
        <id_carrier>${id_carrier}</id_carrier>
        <module>ps_checkpayment</module>
        <payment>Check payment</payment>
        <secure_key>${secureKey}</secure_key>
        <conversion_rate>1.000000</conversion_rate>
        <total_products>${toFixed6(total_products)}</total_products>
        <total_products_wt>${toFixed6(total_products_wt)}</total_products_wt>
        <total_shipping>${toFixed6(total_shipping)}</total_shipping>
        <total_shipping_tax_incl>${toFixed6(total_shipping_tax_incl)}</total_shipping_tax_incl>
        <total_shipping_tax_excl>${toFixed6(total_shipping_tax_excl)}</total_shipping_tax_excl>
        <total_discounts>${toFixed6(total_discounts)}</total_discounts>
        <total_discounts_tax_incl>${toFixed6(total_discounts_tax_incl)}</total_discounts_tax_incl>
        <total_discounts_tax_excl>${toFixed6(total_discounts_tax_excl)}</total_discounts_tax_excl>
        <total_wrapping>${toFixed6(total_wrapping)}</total_wrapping>
        <total_wrapping_tax_incl>${toFixed6(total_wrapping_tax_incl)}</total_wrapping_tax_incl>
        <total_wrapping_tax_excl>${toFixed6(total_wrapping_tax_excl)}</total_wrapping_tax_excl>
        <total_paid>${toFixed6(total_paid)}</total_paid>
        <total_paid_tax_incl>${toFixed6(total_paid_tax_incl)}</total_paid_tax_incl>
        <total_paid_tax_excl>${toFixed6(total_paid_tax_excl)}</total_paid_tax_excl>
        <total_paid_real>${toFixed6(total_paid_real)}</total_paid_real>
        <date_add>${dateFormatted}</date_add>
        <valid>1</valid>
    </order>
</prestashop>`;
        console.log("ORDER XML:");
        console.log(orderXml);
        const res = await apiService.post<any>("/orders", orderXml);
        console.log("ORDER RESPONSE:", res);
        const id = res?.prestashop?.order?.id;
        if (!id) throw new Error("No order id returned");
        const id_order = parseInt(id, 10);
        orderCountMap.set(id_order, true);
        console.log(`Order created: ${id_order}`);

        // =====================================================
        // ORDER STATE
        // =====================================================
        if (etat) {
            let id_order_state = STATUS_MAP[etat];
            if (!id_order_state) id_order_state = 2;
            const historyXml = `
<prestashop>
    <order_history>
        <id_order>${id_order}</id_order>
        <id_order_state>${id_order_state}</id_order_state>
        <date_add>${dateFormatted}</date_add>
    </order_history>
</prestashop>`;
            await apiService.post("/order_histories", historyXml);
            console.log(`Order history added: order ${id_order} → state ${id_order_state}`);
        }
    } catch (err: any) {
        console.error(`ORDER ERROR:`);
        if (err.response) {
            console.error("STATUS:", err.response.status);
            console.error("DATA:", err.response.data);
            console.error("HEADERS:", err.response.headers);
        } else {
            console.error(err);
        }
    }
}