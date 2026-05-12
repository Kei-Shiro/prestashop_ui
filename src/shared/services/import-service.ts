import apiService from './api-service'
import Papa from 'papaparse'
import prestashopColumnsJson from '../utils/prestashop-columns.json'

const prestashopColumns = prestashopColumnsJson as Record<string, string[]>;

export interface ImportItem {
    id: number;
    file: File | null;
    endpoint: string;
}

const parseCsv = (file: File): Promise<Record<string, string>[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => resolve(r.data as Record<string, string>[]),
            error: reject
        })
    })
}

// Transform endpoint path to singular resource name (e.g. /api/products -> product)
const getResourceName = (endpoint: string) => {
    const parts = endpoint.split('/').filter(Boolean);
    let name = parts[parts.length - 1];
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y'; // categories -> category
    if (name.endsWith('s')) return name.slice(0, -1); // products -> product
    return name;
}

const buildNode = (obj: Record<string, any>, indent: string = '  '): string => {
    let xml = '';
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined || value === null) continue;
        
        if (typeof value === 'object' && value !== null) {
            xml += `${indent}<${key}>\n${buildNode(value, indent + '  ')}${indent}</${key}>\n`;
        } else {
            // Some known PrestaShop fields require <language id="1"> nesting
            const langFields = ['name', 'description', 'description_short', 'link_rewrite', 'meta_title', 'meta_description', 'meta_keywords'];
            
            if (langFields.includes(key)) {
                xml += `${indent}<${key}><language id="1"><![CDATA[${value}]]></language></${key}>\n`;
            } else {
                xml += `${indent}<${key}><![CDATA[${value}]]></${key}>\n`;
            }
        }
    }
    return xml;
};

const buildPrestashopXml = (resourceName: string, row: Record<string, string>) => {
    // Get valid columns for this resource
    const validColumns = prestashopColumns[resourceName] || [];

    // Convert flat keys with '__' to a nested object
    const tree: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
        if (value === undefined || value === null || value === '') continue; // Skip empty fields
        
        // Filter against valid columns: must match exactly or be a nested association field
        const isValid = validColumns.length === 0 || validColumns.includes(key) || validColumns.some(col => key.startsWith(col + '__'));
        if (!isValid) continue;

        const parts = key.split('__');
        let current = tree;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) current[part] = {};
            current = current[part];
        }
        current[parts[parts.length - 1]] = value;
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">\n`
    xml += `<${resourceName}>\n`
    
    xml += buildNode(tree, '  ');
    
    xml += `</${resourceName}>\n`
    xml += `</prestashop>`
    return xml;
}

const importService = {
    async importDynamic(items: ImportItem[]): Promise<void> {
        for (const item of items) {
            if (!item.file || !item.endpoint) continue;

            const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
            const resourceName = getResourceName(item.endpoint);

            if (ext === 'csv') {
                const rows = await parseCsv(item.file);
                for (const row of rows) {
                    const xmlPayload = buildPrestashopXml(resourceName, row);
                    // Post each row to the PrestaShop API
                    await apiService.post(item.endpoint, xmlPayload, {
                        headers: { 'Content-Type': 'application/xml' }
                    });
                }
            } else {
                // Pour le ZIP ou les autres fichiers, on ne peut pas les envoyer directement comme ça
                // sur les endpoints natifs PrestaShop, on les ignore ou on les envoie à un endpoint dédié.
                console.warn(`Le format ${ext} n'est pas pris en charge pour un import direct par ligne sur l'API native.`);
            }
        }
    },

    async importFile(file: File, endpoint: string): Promise<void> {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const resourceName = getResourceName(endpoint);

        if (ext === 'csv') {
            const rows = await parseCsv(file);
            for (const row of rows) {
                const xmlPayload = buildPrestashopXml(resourceName, row);
                await apiService.post(endpoint, xmlPayload, {
                    headers: { 'Content-Type': 'application/xml' }
                });
            }
        } else if (ext === 'json') {
            const text = await file.text();
            const data = JSON.parse(text);
            const items = Array.isArray(data) ? data : [data];
            for (const row of items) {
                const xmlPayload = buildPrestashopXml(resourceName, row);
                await apiService.post(endpoint, xmlPayload, {
                    headers: { 'Content-Type': 'application/xml' }
                });
            }
        } else {
            console.warn(`Le format ${ext} n'est pas pris en charge.`);
        }
    },

    async importGoogleSheet(sheetUrl: string, endpoint: string): Promise<void> {
        // Extract sheet ID from URL
        const match = sheetUrl.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (!match) {
            throw new Error('Invalid Google Sheet URL');
        }

        const sheetId = match[1];
        // Export as CSV using the public export URL
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch Google Sheet');
        }

        const csvText = await response.text();

        // Parse the CSV and import
        const rows = csvText.split('\n').filter(line => line.trim()).map(line => {
            const values = line.split(',');
            const obj: Record<string, string> = {};
            // Assuming first row is header
            return obj;
        });

        // For now, log that Google Sheet import needs proper implementation
        console.log('Google Sheet import initiated for:', sheetUrl);
    }
}

export default importService
