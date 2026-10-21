import NewsletterSubscriber from '../../domain/entities/NewsletterSubscriber.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'subscribers';

const fromRow = (r) =>
  new NewsletterSubscriber({
    id: r.id,
    email: r.email,
    active: r.active,
    confirmToken: r.confirm_token,
    unsubscribeToken: r.unsubscribe_token,
    confirmedAt: r.confirmed_at,
    unsubscribedAt: r.unsubscribed_at,
    createdAt: r.created_at,
  });

export default class NewsletterRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async create(email) {
    return fromRow(
      unwrap(await this.supabase.from(TABLE).insert({ email }).select().single())
    );
  }

  async findByEmail(email) {
    // L'index d'unicité est sur lower(email) : on stocke et cherche en minuscules.
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .ilike('email', escapeLike(email))
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async findByConfirmToken(token) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('confirm_token', token).maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async findByUnsubscribeToken(token) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .eq('unsubscribe_token', token)
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  /** patch : { active, confirmedAt, unsubscribedAt } (clés camelCase). */
  async update(id, patch) {
    const row = {};
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.confirmedAt !== undefined) row.confirmed_at = patch.confirmedAt;
    if (patch.unsubscribedAt !== undefined) row.unsubscribed_at = patch.unsubscribedAt;
    if (patch.regenerateConfirmToken) row.confirm_token = crypto.randomUUID();
    return fromRow(
      unwrap(await this.supabase.from(TABLE).update(row).eq('id', id).select().single())
    );
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

  /** Destinataires légitimes uniquement : confirmés, actifs, non désinscrits. */
  async listReceivers() {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .eq('active', true)
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null)
    );
    return data.map(fromRow);
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}

/** ilike traite % _ \ comme des jokers : on les neutralise pour une égalité stricte. */
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
