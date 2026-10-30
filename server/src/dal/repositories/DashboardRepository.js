import { unwrap } from '../unwrap.js';

const DAY = 24 * 60 * 60 * 1000;

/** Requêtes d'agrégats du tableau de bord admin (service_role). */
export default class DashboardRepository {
  constructor(supabase, clock = () => new Date()) {
    this.supabase = supabase;
    this.clock = clock;
  }

  /** Nombre de lignes (requête HEAD : aucune donnée transférée). */
  async #count(table, apply = (q) => q) {
    const { count, error } = await apply(
      this.supabase.from(table).select('*', { count: 'exact', head: true })
    );
    unwrap({ data: null, error });
    return count || 0;
  }

  #daysAgo(days) {
    return new Date(this.clock().getTime() - days * DAY).toISOString();
  }

  async counts() {
    const confirmed = (q) => q.not('confirmed_at', 'is', null).eq('active', true);
    const [published, drafts, unreadMessages, pendingComments, subscribers, newThisWeek] =
      await Promise.all([
        this.#count('articles', (q) => q.eq('status', 'published')),
        this.#count('articles', (q) => q.eq('status', 'draft')),
        this.#count('messages', (q) => q.eq('lu', false)),
        this.#count('comments', (q) => q.eq('approved', false)),
        this.#count('subscribers', confirmed),
        this.#count('subscribers', (q) =>
          confirmed(q).gte('confirmed_at', this.#daysAgo(7))
        ),
      ]);
    return {
      articles: { published, drafts },
      unreadMessages,
      pendingComments,
      subscribers: { confirmed: subscribers, newThisWeek },
    };
  }

  /** Vues des 30 derniers jours et des 30 jours précédents (pour la variation). */
  async views30d() {
    const [current, previous] = await Promise.all([
      this.#count('article_views', (q) => q.gte('viewed_at', this.#daysAgo(30))),
      this.#count('article_views', (q) =>
        q.gte('viewed_at', this.#daysAgo(60)).lt('viewed_at', this.#daysAgo(30))
      ),
    ]);
    return { current, previous };
  }

  async viewsByMonth() {
    const data = unwrap(await this.supabase.rpc('article_views_by_month'));
    return (data || []).map((r) => ({ month: r.month, views: Number(r.views) }));
  }

  async topArticles(limit = 3) {
    return unwrap(
      await this.supabase
        .from('articles')
        .select('id, title, slug, views')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit)
    );
  }

  async topVideos(limit = 3) {
    return unwrap(
      await this.supabase
        .from('videos')
        .select('id, title, views')
        .eq('status', 'published')
        .order('views', { ascending: false })
        .limit(limit)
    );
  }

  async publishedVideoSeconds() {
    const data = unwrap(
      await this.supabase
        .from('videos')
        .select('duration_seconds')
        .eq('status', 'published')
    );
    return data.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
  }
}
