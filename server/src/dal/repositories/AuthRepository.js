/** Vérifie un JWT Supabase et lit le rôle dans profiles (service_role). */
export default class AuthRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /** Renvoie { id, email } ou null si le jeton est invalide. */
  async getUserFromToken(jwt) {
    const { data, error } = await this.supabase.auth.getUser(jwt);
    if (error || !data || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  }

  async getRole(userId) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(`Erreur base de données : ${error.message}`);
    return data ? data.role : null;
  }
}
