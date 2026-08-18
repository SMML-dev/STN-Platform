/**
 * Formate une date ISO (YYYY-MM-DD) ou une chaîne de date en format français (DD/MM/YYYY).
 * Retourne '—' si la valeur est vide ou invalide.
 * @param {string} dateStr - Date au format YYYY-MM-DD
 * @returns {string} Date au format DD/MM/YYYY
 */
export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  // Supporte les formats YYYY-MM-DD et YYYY-MM-DDTHH:mm:ss
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}
