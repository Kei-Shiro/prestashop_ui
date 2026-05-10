// import-service.ts — dispatcher mis à jour avec endpoint
import { importCsv } from './import_type/csv-import'
import { importExcel } from './import_type/excel-import'
import { importSheet } from './import_type/sheet-import'

const importService = {
    async importFile(file: File, endpoint: string): Promise<void> {
        const ext = file.name.split('.').pop()?.toLowerCase()
        switch (ext) {
            case 'csv':  return importCsv(file, endpoint)
            case 'xlsx':
            case 'xls':  return importExcel(file, endpoint)
            default: throw new Error(`Format non supporté : ${ext}`)
        }
    },

    async importGoogleSheet(sheetUrl: string, endpoint: string): Promise<void> {
        return importSheet(sheetUrl, endpoint)
    },
}

export default importService