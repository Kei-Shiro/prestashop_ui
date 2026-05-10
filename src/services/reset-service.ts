// src/services/reset-service.ts
import apiService from './api-service'

async function deleteAll(endpoint: string): Promise<void> {
    const res: any = await apiService.get(`${endpoint}?display=[id]`)

    const list = res?.prestashop?.[endpoint.slice(1)]?.[endpoint.slice(1, -1)] ?? []
    const items = Array.isArray(list) ? list : [list]

    for (const item of items) {
        await apiService.delete(`${endpoint}/${item.id}`)
    }
}

// PrestaShop resources to reset (in order to respect dependencies)
const RESET_ENDPOINTS = [

    '/products'

]

const resetService = {
    async resetAll(): Promise<void> {
        for (const ep of RESET_ENDPOINTS) {
            await deleteAll(ep)
        }
    }
}

export default resetService