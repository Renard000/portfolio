/** Remplace {nom} par sa valeur. */
export const interpolate = (text, values = {}) =>
  text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);

const isFilled = (value) => value !== null && value !== undefined && value !== '';

/**
 * Applique en profondeur la version anglaise reçue de l'API : chaque objet portant
 * un champ `en` prend ses valeurs remplies ; les autres restent en français.
 */
export function applyTranslation(data) {
  if (Array.isArray(data)) return data.map(applyTranslation);
  if (!data || typeof data !== 'object') return data;
  const out = {};
  for (const [key, value] of Object.entries(data)) out[key] = applyTranslation(value);
  if (out.en && typeof out.en === 'object')
    for (const [key, value] of Object.entries(out.en))
      if (isFilled(value)) out[key] = value;
  return out;
}

/** Retire les champs anglais laissés vides avant l'envoi à l'API. */
export function cleanTranslation(en) {
  return Object.fromEntries(
    Object.entries(en || {})
      .map(([key, value]) => [key, String(value ?? '').trim()])
      .filter(([, value]) => value)
  );
}
