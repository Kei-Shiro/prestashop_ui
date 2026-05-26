import apiService from '@shared/api/api-service';
import { extractLanguageValue } from '@shared/utils/extractLanguageValue';
import type { Category, CategoryCreatePayload } from '@shared/types/category';

// Re-export canonical type for consumers
export type { Category } from '@shared/types/category';

/** @deprecated use Category from @shared/types/category */
export type Categorie = Category;

export const categoryService = {
    async getAll(): Promise<Category[]> {
        const list = await apiService.fetchList<any>('/categories?display=full', 'categories', 'category');
        return list.map((c: any): Category => ({
            id: String(c.id),
            name: extractLanguageValue(c.name),
            id_parent: c.id_parent ? String(c.id_parent) : undefined,
            active: c.active ? String(c.active) : undefined,
            position: c.position ? String(c.position) : undefined,
            date_add: c.date_add || undefined,
            date_upd: c.date_upd || undefined,
            link_rewrite: extractLanguageValue(c.link_rewrite) || undefined,
            description: extractLanguageValue(c.description) || undefined,
            associations: c.associations,
        }));
    },

    async create(payload: CategoryCreatePayload): Promise<string> {
        const response = await apiService.post<any>('/categories', { category: payload });
        return String(response.prestashop.category.id);
    }
};


/** @deprecated use categoryService */
export const categorieService = categoryService;
export default categoryService;
