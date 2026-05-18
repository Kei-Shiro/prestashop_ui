import apiService from "@shared/api/api-service";
import { ensureArray } from '@shared/utils/arrayUtils';
import {Categorie} from "@shared/types/categorie";

const categorieService = {

    async getAll(): Promise<Categorie[]> {
        const list = await apiService.fetchList<any>('/categories?display=full', 'categories', 'category');
        return list.map((p: any) => ({
            id: p.id,
            name: p.name?.language ?? p.name
        }));
    }
}

export default categorieService;