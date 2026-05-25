export function extractIdValue(val: any): string {
    if (val == null) return '';
    if (typeof val === 'object') {
        const v = val['#text'] ?? val.id ?? val.value ?? val['@_id'];
        return v != null ? String(v) : '';
    }
    return String(val);
}

export function extractIdNumber(val: any): number {
    return Number(extractIdValue(val)) || 0;
}

