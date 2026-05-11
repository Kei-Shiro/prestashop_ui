// excel-import.ts — parse XLSX/XLS et envoie les données à l'API
import * as XLSX from 'xlsx'
import apiService from '../api-service'

export async function importExcel(file: File, endpoint: string): Promise<void> {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]] // 1er onglet
    const data = XLSX.utils.sheet_to_json(sheet)
    await apiService.post(endpoint, data as unknown as string)
}