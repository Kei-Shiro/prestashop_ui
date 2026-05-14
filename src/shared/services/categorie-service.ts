import apiService from "@shared/services/api-service";
import {Categorie} from "@shared/types/categorie";

const categorieService = {

    async getAll(): Promise<Categorie[]> {
        const res = await apiService.get<any>('/categories?display=full')
        let list = res?.prestashop?.categories?.category ?? [];
        if(!Array.isArray(list)) list = [list]
        return list.map((p: any) => ({
            id: p.id,
            name: p.name?.language ?? p.name
        }));
    }
}

export default categorieService;