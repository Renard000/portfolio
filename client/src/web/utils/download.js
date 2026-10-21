/** Télécharge du texte comme fichier (export CSV). BOM UTF-8 pour qu'Excel lise les accents. */
export function downloadTextFile(filename, content, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob(['\ufeff', content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
