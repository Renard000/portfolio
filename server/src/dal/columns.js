/** Copie les champs définis du DTO (camelCase) vers leurs colonnes (snake_case). */
export function toColumns(dto, map) {
  const row = {};
  for (const [key, col] of Object.entries(map))
    if (dto[key] !== undefined) row[col] = dto[key];
  return row;
}

/**
 * Texte de recherche sûr pour un filtre PostgREST `or(...ilike...)` :
 * on retire les caractères qui ont un sens dans la syntaxe du filtre.
 */
export function searchTerm(q) {
  return String(q || '')
    .replace(/[,()%*\\:"'.]/g, ' ')
    .trim()
    .slice(0, 100);
}
