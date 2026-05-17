/**
 * Extrait l'ID numérique d'un champ PrestaShop.
 * Gère les IDs simples et les objets avec attributs xlink (#text).
 */
export function extractIdValue(val: any): string {
    if (val == null) return '';
    if (typeof val === 'object') {
        // fast-xml-parser retourne #text si la balise a des attributs
        return String(val['#text'] || val.id || val.value || '');
    }
    return String(val);
}
