/**
 * Enveloppe du client Supabase (anon) : authentification et Storage uniquement.
 * Les données passent par l'API Node, jamais par ce client.
 */
export default class SupabaseAuthClient {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  async getSession() {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async getAccessToken() {
    const session = await this.getSession();
    return session ? session.access_token : null;
  }

  /** Renvoie une fonction pour se désabonner. */
  onAuthStateChange(callback) {
    const { data } = this.supabase.auth.onAuthStateChange((_event, session) =>
      callback(session)
    );
    return () => data.subscription.unsubscribe();
  }

  async uploadImage(file, path, bucket = 'images') {
    const { error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}
