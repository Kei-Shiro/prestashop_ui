/**
 * Convertit une donnée potentiellement unique ou inexistante (typique du parsing XML) en un tableau natif.
 * Évite de répéter Array.isArray(x) ? x : (x ? [x] : []) partout dans le code.
 * 
 * @param data - La donnée à normaliser en tableau
 * @returns Un tableau contenant les éléments
 */
export function ensureArray<T>(data: T | T[] | undefined | null): T[] {
    if (data == null) return [];
    if (Array.isArray(data)) return data;
    return [data];
}
