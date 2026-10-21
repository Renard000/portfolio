/** Transforme la réponse Supabase { data, error } en valeur, ou lève l'erreur. */
export function unwrap({ data, error }) {
  if (error) throw new Error(`Erreur base de données : ${error.message}`);
  return data;
}
