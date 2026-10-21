/**
 * Export CSV (RFC 4180). Les cellules qui commencent par = + - @ sont préfixées
 * d'une apostrophe : sinon Excel exécuterait la « formule » (injection CSV).
 */
export function toCsv(rows, columns) {
  const cell = (v) => {
    let s = v === null || v === undefined ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => cell(c.label)).join(',');
  const lines = rows.map((r) => columns.map((c) => cell(c.value(r))).join(','));
  return [header, ...lines].join('\r\n');
}
