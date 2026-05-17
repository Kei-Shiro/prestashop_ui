export function extractLanguageValue(field: any): string {
    if (!field) return '';
    if (typeof field === 'string') return field;

    if (field.language) {
        const lang = field.language;
        if (Array.isArray(lang)) {
            const l = lang[0];
            return typeof l === 'string' ? l : String(l?.['#text'] || l?.value || l?.textContent || '');
        }
        return typeof lang === 'string' ? lang : String(lang?.['#text'] || lang.value || lang.textContent || '');
    }

    if (field['#text']) return String(field['#text']);
    if (field.value) return String(field.value);
    if (field.textContent) return String(field.textContent);

    return '';
}