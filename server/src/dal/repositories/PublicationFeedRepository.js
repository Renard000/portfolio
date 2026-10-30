import { unwrap } from '../unwrap.js';

const TABLE = 'publications';

const fromRow = (r) => ({
  id: r.id,
  kind: r.kind,
  refId: r.ref_id,
  title: r.title,
  path: r.path,
  publishedAt: r.published_at,
});

/** Fil des publications récentes, lu par le site (badge NEW, point rouge). */
export default class PublicationFeedRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async listSince(date, limit) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('*')
        .gte('published_at', date)
        .order('published_at', { ascending: false })
        .limit(limit)
    );
    return data.map(fromRow);
  }

  /** Supprime puis insère : une republication redevient une nouveauté (événement INSERT). */
  async record({ kind, id, title, path }) {
    await this.remove({ kind, id });
    unwrap(await this.supabase.from(TABLE).insert({ kind, ref_id: id, title, path }));
  }

  async remove({ kind, id }) {
    unwrap(await this.supabase.from(TABLE).delete().eq('kind', kind).eq('ref_id', id));
  }
}
