// src/services/reset-service.ts
import apiService from './api-service'
import { erasableEndpoints } from '../utils/endpoints'

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
    const res: any = await apiService.get(`${endpoint}?display=[id]`)
    const list = res?.prestashop?.[endpoint.slice(1)]?.[endpoint.slice(1, -1)] ?? []
    const items = Array.isArray(list) ? list : (list.id ? [list] : [])
    const failedIds: string[] = []
    for (const item of items) {
        if (!item?.id) continue
        try {
            await apiService.delete(`${endpoint}/${item.id}`)
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${item.id}`, error)
            failedIds.push(item.id)
        }
    }
    return failedIds
}

async function deleteFiltered(endpoint: string, filterStr: string): Promise<string[]> {
    const res: any = await apiService.get(`${endpoint}?display=[id]`)
    const list = res?.prestashop?.[endpoint.slice(1)]?.[endpoint.slice(1, -1)] ?? []
    const items = Array.isArray(list) ? list : (list.id ? [list] : [])
    const match = filterStr.match(/^(\w+)=!\[(.*)\]$/)
    if (!match) {
        console.warn(`Filtre non supporté pour ${endpoint}: ${filterStr}, suppression totale`)
        return deleteAll(endpoint)
    }
    const [, field, excludedRaw] = match
    const excludedIds = new Set(excludedRaw.split('|').map(s => s.trim()))
    const failedIds: string[] = []
    for (const item of items) {
        const id = String(item.id)
        if (excludedIds.has(id)) {
            console.log(`Gardé (exclu) : ${endpoint}/${id}`)
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
    const res: any = await apiService.get(`${endpoint}?display=full`)
    const stockList = res?.prestashop?.stock_availables?.stock_available ?? []
    const items = Array.isArray(stockList) ? stockList : (stockList.id ? [stockList] : [])
    const failedIds: string[] = []

    for (const item of items) {
        if (!item.id) continue
        try {
            // Construire le XML avec TOUS les champs obligatoires
            const xml = `<prestashop>
                <stock_available>
                    <id>${item.id}</id>
                    <id_product>${item.id_product}</id_product>
                    <id_product_attribute>${item.id_product_attribute || 0}</id_product_attribute>
                    <quantity>0</quantity>
                    <depends_on_stock>${item.depends_on_stock ?? 0}</depends_on_stock>
                    <out_of_stock>${item.out_of_stock ?? 2}</out_of_stock>
                </stock_available>
            </prestashop>`
            await apiService.put(`${endpoint}/${item.id}`, xml)
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
            const { failed } = await resetEndpoint(ep)
            processed.add(ep)
            if (failed.length > 0) hasFailures = true
        }

        for (const ep of Object.keys(specialHandlingEndpoints)) {
            if (!processed.has(ep)) {
                console.log(`Endpoint spécial supplémentaire (hors erasableEndpoints) : ${ep}`)
                const { failed } = await resetEndpoint(ep)
                if (failed.length > 0) hasFailures = true
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