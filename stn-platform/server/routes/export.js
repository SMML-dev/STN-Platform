const XLSX = require('xlsx');

function toCSV(headers, rows) {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.map(escapeCSV).join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCSV(row[h])).join(','));
  }
  return lines.join('\n');
}

function toXLSX(sheetName, headers, rows, headerLabels) {
  const data = [headerLabels || headers];
  for (const row of rows) {
    data.push(headers.map(h => row[h] !== null && row[h] !== undefined ? row[h] : ''));
  }
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Largeur automatique des colonnes selon le contenu
  ws['!cols'] = headers.map((h, colIdx) => {
    let maxLen = String((headerLabels || headers)[colIdx]).length;
    for (const row of rows) {
      const val = row[h];
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    }
    return { wch: Math.min(maxLen + 2, 50) };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

function sendXLSX(res, filename, buffer) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

module.exports = { toCSV, toXLSX, sendXLSX };
