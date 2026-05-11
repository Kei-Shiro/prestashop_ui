// src/services/reset-service.ts
import apiService from './api-service'
import { erasableEndpoints } from '../utils/endpoints'

async function deleteAll(endpoint: string): Promise<string[]> {
    const res: any = await apiService.get(`${endpoint}?display=[id]`)

    const list = res?.prestashop?.[endpoint.slice(1)]?.[endpoint.slice(1, -1)] ?? []
    const items = Array.isArray(list) ? list : (list.id ? [list] : [])

    const failedIds: string[] = []

    for (const item of items) {
        if (!item || !item.id) continue;
        try {
            await apiService.delete(`${endpoint}/${item.id}`)
        } catch (error) {
            console.warn(`Failed to delete ${endpoint}/${item.id}`, error)
            failedIds.push(item.id)
        }
    }

    return failedIds
}

// PrestaShop resources to reset (in order to respect dependencies)
const RESET_ENDPOINTS = erasableEndpoints

const resetService = {
    async resetAll(): Promise<void> {
        let hasFailures = false;

        // Passe 1 : Tentative de suppression dans l'ordre défini
        for (const ep of RESET_ENDPOINTS) {
            const failed = await deleteAll(ep)
            if (failed.length > 0) {
                hasFailures = true
            }
        }

        // Passe 2 (optionnelle) : S'il y a eu des échecs
        // on refait une tentative générale, sans bloquer si ça rate encore.
        if (hasFailures) {
            console.log("Des éléments n'ont pas pu être supprimés, tentative de deuxième passe...")
            for (const ep of RESET_ENDPOINTS) {
                await deleteAll(ep)
            }
        }
    },

}

export default resetService