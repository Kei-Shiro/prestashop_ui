import apiService from '@shared/api/api-service';
import { erasableEndpoints } from '@shared/utils/endpoints'
import type { StockAvailablePut } from '@shared/types/import'

const extractId = (v: any): string => {
    if (v == null) return '';
    return String(typeof v === 'object' ? (v['#text'] || v.id || v.value || '') : v);
};

const toNum = (v: any): number => Number(extractId(v)) || 0;

function extractList(res: any, endpoint: string): any[] {
    const container = res?.prestashop?.[endpoint.slice(1)]
    if (!container || typeof container !== 'object') return []
    const childKey = Object.keys(container).find(k => !k.startsWith('@_'))
    const list = childKey ? container[childKey] : []
    return Array.isArray(list) ? list : (list ? [list] : [])
}

const specialHandlingEndpoints: Record<string, {
    action: string
    filter?: string
    note: string
}> = {
    '/categories': {
        action: 'delete_filtered',
        filter: 'id=![1|2]',
        note: 'Garder Root (1) et Home (2) — hardcodés dans le core',
    },
    '/addresses': {
        action: 'delete_filtered',
        filter: 'id_customer=![0]',
        note: 'Garder adresses système (shops, warehouses)',
    },
    '/stock_availables': {
        action: 'put_quantity_zero',
        note: 'NE JAMAIS DELETE — PUT quantity=0',
    },
}

async function deleteAll(endpoint: string): Promise<string[]> {
    let items: any[]

    if (endpoint === '/stockmvtapi/stockmvt') {
        try {
            const res: any = await apiService.get('/stock_movements?display=[id]')
            items = res?.prestashop?.stock_mvts?.stock_mvt || []
            
            console.log(`[resetService] ${items.length} mouvements de stock à supprimer via module API`);
            
            for (const item of items) {
                const id = extractId(item?.id)
                if (id) {
                    try {
                        await apiService.delete(`/stock_movements/${id}`)
                    } catch (err) {
                        console.warn(`[resetService] Échec suppression mouvement ${id}`, err)
                    }
                }
            }
            return [] // Terminé pour cet endpoint spécial
        } catch (error) {
            console.warn(`[resetService] Initialisation reset ${endpoint} échouée`, error)
            return []
        }
    }
    try {
        const res: any = await apiService.get(`${endpoint}?display=[id]`)
        items = extractList(res, endpoint)
    } catch (error) {
        // GET en échec (401 ressource non autorisée, 404, réseau…) :
        // on ignore CET endpoint sans faire planter tout le reset.
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error)
        return []
    }
    items.sort((a: any, b: any) => Number(extractId(a?.id)) - Number(extractId(b?.id)))
    const failedIds: string[] = []
    for (const item of items) {
        const id = extractId(item?.id)
        if (!id) continue

        try {
            await apiService.delete(`${endpoint}/${id}`)
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${id}`, error)
            failedIds.push(id)
        }
    }
    return failedIds
}

async function deleteFiltered(endpoint: string, filterStr: string): Promise<string[]> {
    const match = filterStr.match(/^(\w+)=!\[(.*)\]$/)
    if (!match) {
        console.warn(`Filtre non supporté pour ${endpoint}: ${filterStr}, suppression totale`)
        return deleteAll(endpoint)
    }
    const [, field, excludedRaw] = match
    const excludedIds = new Set(excludedRaw.split('|').map(s => s.trim()))

    const displayFields = field === 'id' ? '[id]' : `[id,${field}]`
    let items: any[]
    try {
        const res: any = await apiService.get(`${endpoint}?display=${displayFields}`)
        items = extractList(res, endpoint)
    } catch (error) {
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error)
        return []
    }
    items.sort((a: any, b: any) => Number(extractId(a?.id)) - Number(extractId(b?.id)))
    const failedIds: string[] = []
    for (const item of items) {
        const id = extractId(item?.id)
        if (!id) continue

        const fieldValue = extractId(item?.[field])

        if (excludedIds.has(fieldValue)) {
            console.log(`Gardé (exclu) : ${endpoint}/${id} (car ${field}=${fieldValue})`)
            continue
        }
        try {
            await apiService.delete(`${endpoint}/${id}`)
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${id}`, error)
            failedIds.push(id)
        }
    }
    return failedIds
}

async function putQuantityZero(endpoint: string): Promise<string[]> {
    // Récupérer tous les stocks avec leurs champs complets
    let items: any[]
    try {
        const res: any = await apiService.get(`${endpoint}?display=full`)
        items = extractList(res, endpoint)
    } catch (error) {
        console.warn(`GET ${endpoint} échoué — endpoint ignoré`, error)
        return []
    }
    const failedIds: string[] = []

    for (const item of items) {
        if (!item.id) continue
        try {
            const stockData: StockAvailablePut = {
                id: toNum(item.id),
                id_product: toNum(item.id_product),
                id_product_attribute: toNum(item.id_product_attribute),
                id_shop: toNum(item.id_shop) || 1,
                id_shop_group: toNum(item.id_shop_group),
                quantity: 0,
                depends_on_stock: toNum(item.depends_on_stock),
                out_of_stock: toNum(item.out_of_stock),
                location: item.location || '',
            }
            await apiService.put(`${endpoint}/${stockData.id}`, { stock_available: stockData })
            console.log(`Stock ${item.id} mis à 0`)
        } catch (error) {
            console.warn(`Failed to set quantity=0 for ${endpoint}/${item.id}`, error)
            failedIds.push(item.id)
        }
    }
    return failedIds
}

async function resetEndpoint(endpoint: string): Promise<{ endpoint: string; failed: string[] }> {
    const special = specialHandlingEndpoints[endpoint]
    let failed: string[] = []

    if (special) {
        console.log(`Traitement spécial pour ${endpoint} → ${special.action}`)
        switch (special.action) {
            case 'delete_filtered':
                if (special.filter) {
                    failed = await deleteFiltered(endpoint, special.filter)
                } else {
                    console.warn(`Pas de filtre pour ${endpoint}, suppression totale`)
                    failed = await deleteAll(endpoint)
                }
                break
            case 'put_quantity_zero':
                failed = await putQuantityZero(endpoint)
                break
            default:
                console.warn(`Action spéciale inconnue pour ${endpoint}: ${special.action}, fallback deleteAll`)
                failed = await deleteAll(endpoint)
        }
    } else {
        failed = await deleteAll(endpoint)
    }

    return { endpoint, failed }
}

const MAIN_ENDPOINTS = erasableEndpoints

const resetService = {
    async resetAll(): Promise<void> {
        let hasFailures = false
        const processed = new Set<string>()

        for (const ep of MAIN_ENDPOINTS) {
            try {
                const { failed } = await resetEndpoint(ep)
                if (failed.length > 0) hasFailures = true
            } catch (error) {
                        console.error(`resetEndpoint(${ep}) a échoué — on poursuit`, error)
                hasFailures = true
            }
            processed.add(ep)
        }

        for (const ep of Object.keys(specialHandlingEndpoints)) {
            if (!processed.has(ep)) {
                console.log(`Endpoint spécial supplémentaire (hors erasableEndpoints) : ${ep}`)
                try {
                    const { failed } = await resetEndpoint(ep)
                    if (failed.length > 0) hasFailures = true
                } catch (error) {
                    console.error(`resetEndpoint(${ep}) a échoué — on poursuit`, error)
                    hasFailures = true
                }
            }
        }

        if (hasFailures) {
            console.log("Certains éléments n'ont pas pu être traités – deuxième passe générale...")
            for (const ep of MAIN_ENDPOINTS) {
                await resetEndpoint(ep)
            }
            for (const ep of Object.keys(specialHandlingEndpoints)) {
                if (!processed.has(ep)) {
                    await resetEndpoint(ep)
                }
            }
        }
    },
}

export default resetService