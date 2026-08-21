export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  if (!year || !month || !day) return dateStr;
  return `${day}/${month}/${year}`;
}
