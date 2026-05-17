/**
 * Extrait l'ID numérique d'un champ PrestaShop.
 * Gère les IDs simples et les objets avec attributs xlink (#text ou @_id).
 */
export function extractIdValue(val: any): string {
    if (val == null) return '';
    if (typeof val === 'object') {
        // fast-xml-parser retourne #text si la balise a des attributs ET un contenu texte,
        // ou @_id si c'est une balise auto-fermante (ex: <resource id="5" xlink:href="..."/>)
        const v = val['#text'] ?? val.id ?? val.value ?? val['@_id'];
        return v != null ? String(v) : '';
    }
    return String(val);
}
