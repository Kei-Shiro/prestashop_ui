import apiService from "@shared/services/api-service";
import {Categorie} from "@shared/types/categorie";

const categorieService = {

    async getAll(): Promise<Categorie[]> {
        const res = await apiService.get('/categories?display=full')
        let list = res?.prestashop?.categories?.category ?? [];
        if(!Array.isArray(list)) list = [list]
        return list.map(async (p: any) => {
            p.name
        }
    }
}