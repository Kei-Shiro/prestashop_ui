import apiService from "./api-service"
import type { Product } from "../types/product"

const productService = {
    async getAll(): Promise<Product[]> {
        const res: any = await apiService.get('/products?display=[id,name,price]')

        let list = res?.prestashop?.products?.product ?? []
        if (!Array.isArray(list)) list = [list]

        return list.map((p: any) => ({
            id_product: Number(p.id),
            name: Array.isArray(p.name?.language) ? p.name.language[0] : p.name?.language ?? '',
            price: p.price,
        }))

    }

}

export default productService