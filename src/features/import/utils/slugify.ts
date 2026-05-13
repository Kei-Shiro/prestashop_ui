/**
 * Génère un slug valide pour link_rewrite (URL rewriting)
 */
export function slugify(text: string): string {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD')                   // décomposer les accents
        .replace(/[\u0300-\u036f]/g, '')    // supprimer les accents
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}