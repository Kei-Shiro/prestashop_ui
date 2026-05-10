export async function importSheet(sheetUrl: string, endpoint: string): Promise<void> {
    // Convertit l'URL Sheets en export CSV
    const csvUrl = sheetUrl.replace('/edit', '/export?format=csv')
    const response = await fetch(csvUrl)
    const text = await response.text()

    // Réutilise le parser CSV via Blob
    const blob = new Blob([text], { type: 'text/csv' })
    const file = new File([blob], 'sheet.csv')

    const { importCsv } = await import('./csv-import')
    await importCsv(file, endpoint)
}