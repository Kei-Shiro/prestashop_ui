// csv-import.ts — parse CSV et envoie les données à l'API
import Papa from 'papaparse'
import apiService from '../api-service'

export async function importCsv(file: File, endpoint: string): Promise<void> {
    const data = await new Promise<unknown[]>((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (r) => resolve(r.data as unknown[]),
            error: (e) => reject(e),
        })
    })
    await apiService.post(endpoint, data as unknown as string)
}