/**
 * Extrait la valeur d'un champ multilingue (name, description, etc.)
 */
export function extractLanguageValue(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;

    // Si c'est un objet avec language
    if (field.language) {
        const lang = field.language;
        if (Array.isArray(lang)) {
            // Prendre la première langue (français)
            const l = lang[0];
            return typeof l === 'string' ? l : (l?.value || l?.textContent || '');
        }
        return typeof lang === 'string' ? lang : (lang.value || lang.textContent || '');
    }

    // Si c'est directement la valeur
    if (field.value) return field.value;
    if (field.textContent) return field.textContent;

    return '';
}