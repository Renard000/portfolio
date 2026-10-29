import { unwrap } from '../unwrap.js';

export default class ContactRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /** Enregistre un message (table messages, lu = false par défaut). */
  async create({ nom, email, sujet, message }) {
    unwrap(
      await this.supabase
        .from('messages')
        .insert({ nom, email, sujet: sujet || null, message })
        .select('id')
        .single()
    );
  }
}
