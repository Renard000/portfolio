import Message from '../../domain/entities/Message.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'messages';

const fromRow = (r) =>
  new Message({
    id: r.id,
    nom: r.nom,
    email: r.email,
    sujet: r.sujet,
    message: r.message,
    lu: r.lu,
    repliedAt: r.replied_at,
    createdAt: r.created_at,
  });

/** Lecture et gestion des messages du formulaire de contact (admin). */
export default class MessageRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async listAll() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .order('created_at', { ascending: false })
    );
    return data.map(fromRow);
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  /** Une réponse envoyée vaut lecture du message. */
  async markReplied(id, repliedAt) {
    return fromRow(
      unwrap(
        await this.supabase
          .from(TABLE)
          .update({ lu: true, replied_at: repliedAt })
          .eq('id', id)
          .select()
          .single()
      )
    );
  }

  async setRead(id, lu) {
    const data = unwrap(
      await this.supabase.from(TABLE).update({ lu }).eq('id', id).select().maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
