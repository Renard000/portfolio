import PushSubscription from '../../domain/entities/PushSubscription.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'push_subscriptions';

const fromRow = (r) =>
  new PushSubscription({
    id: r.id,
    fcmToken: r.fcm_token,
    active: r.active,
    createdAt: r.created_at,
  });

export default class PushSubscriptionRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /** Enregistre le jeton, ou le réactive s'il existe déjà. */
  async upsert(fcmToken) {
    return fromRow(
      unwrap(
        await this.supabase
          .from(TABLE)
          .upsert({ fcm_token: fcmToken, active: true }, { onConflict: 'fcm_token' })
          .select()
          .single()
      )
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

  async listActive() {
    const data = unwrap(await this.supabase.from(TABLE).select('*').eq('active', true));
    return data.map(fromRow);
  }

  async deactivate(tokens) {
    if (!tokens.length) return;
    unwrap(
      await this.supabase.from(TABLE).update({ active: false }).in('fcm_token', tokens)
    );
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
