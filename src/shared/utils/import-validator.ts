/**
 * Validateur strict pour les fichiers CSV d'importation.
 * Lance une erreur explicite si les données ne respectent pas les consignes.
 */

export class ImportValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ImportValidationError';
    }
}

export const ImportValidator = {
    /**
     * Vérifie la présence des colonnes requises (insensible à la casse).
     * @param metaFields Colonnes trouvées dans le CSV
     * @param required Colonnes attendues
     * @returns Un mapping (clé requise -> nom de colonne réel dans le CSV)
     */
    validateColumns(metaFields: string[], required: string[]): Record<string, string> {
        const mapping: Record<string, string> = {};
        const missing: string[] = [];

        for (const req of required) {
            const found = metaFields.find(f => f.toLowerCase() === req.toLowerCase());
            if (found) {
                mapping[req] = found;
            } else {
                missing.push(req);
            }
        }

        if (missing.length > 0) {
            throw new ImportValidationError(`Colonnes manquantes ou non conformes : ${missing.join(', ')}`);
        }

        return mapping;
    },

    /**
     * Valide le format de date DD/MM/YYYY.
     * @param dateStr Chaîne de date brute
     * @param fieldName Nom du champ pour le message d'erreur
     */
    validateDateFormat(dateStr: string, fieldName: string): string {
        if (!dateStr) return '';
        const trimmed = dateStr.trim();
        // Regex stricte pour DD/MM/YYYY
        const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = trimmed.match(regex);

        if (!match) {
            throw new ImportValidationError(`Format de date invalide pour ${fieldName} : "${dateStr}". Attendu: DD/MM/YYYY`);
        }

        const [, day, month, year] = match;
        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        // Vérification logique sommaire
        if (m < 1 || m > 12 || d < 1 || d > 31) {
            throw new ImportValidationError(`Date illogique pour ${fieldName} : "${dateStr}"`);
        }

        // Retourne le format ISO attendu par PrestaShop
        return `${y}-${month}-${day}`;
    },

    /**
     * Valide que le montant est numérique et strictement positif (ou nul selon allowZero).
     * @param val Valeur brute
     * @param fieldName Nom du champ
     */
    validatePositiveAmount(val: string | number, fieldName: string, allowZero = true): number {
        if (val === undefined || val === null || val === '') {
            throw new ImportValidationError(`Le champ ${fieldName} ne peut pas être vide.`);
        }

        let num: number;
        if (typeof val === 'string') {
            num = parseFloat(val.replace(',', '.').trim());
        } else {
            num = val;
        }

        if (isNaN(num)) {
            throw new ImportValidationError(`Valeur non numérique pour ${fieldName} : "${val}"`);
        }

        if (allowZero) {
            if (num < 0) {
                throw new ImportValidationError(`Le montant ${fieldName} doit être positif ou nul.`);
            }
        } else {
            if (num < 0) {
                throw new ImportValidationError(`Le montant ${fieldName} doit être strictement positif.`);
            }
        }

        return num;
    }
};
