/**
 * Convertit une date pour l'envoyer à l'API PrestaShop (format YYYY-MM-DD HH:MM:SS)
 */
export function toPrestashopDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' '); // Fallback sur "maintenant"
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Convertit une date provenant de PrestaShop dans un format d'affichage (FR)
 * Ex: 25/12/2026
 */
export function formatForDisplay(dateStr?: string | null): string {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

/**
 * Convertit une date et heure pour l'affichage (FR)
 * Ex: 25/12/2026 à 14:30
 */
export function formatDateTimeForDisplay(dateStr?: string | null): string {
  if (!dateStr || dateStr === '0000-00-00 00:00:00') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' à');
}
