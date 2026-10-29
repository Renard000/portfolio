import Video from '../../domain/entities/Video.js';
import { unwrap } from '../unwrap.js';

const TABLE = 'videos';

export const videoFromRow = (r) =>
  new Video({
    id: r.id,
    seriesId: r.series_id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    videoKey: r.video_key,
    posterKey: r.poster_key,
    sizeBytes: r.size_bytes,
    durationSeconds: r.duration_seconds,
    position: r.position,
    chapters: r.chapters,
    resources: r.resources,
    status: r.status,
    views: r.views,
    publishedAt: r.published_at,
    createdAt: r.created_at,
  });

const toRow = (d) => {
  const map = {
    seriesId: 'series_id',
    title: 'title',
    slug: 'slug',
    description: 'description',
    videoKey: 'video_key',
    posterKey: 'poster_key',
    sizeBytes: 'size_bytes',
    durationSeconds: 'duration_seconds',
    position: 'position',
    chapters: 'chapters',
    resources: 'resources',
    status: 'status',
    publishedAt: 'published_at',
  };
  const row = {};
  for (const [k, col] of Object.entries(map)) if (d[k] !== undefined) row[col] = d[k];
  return row;
};

export default class VideoRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).select('*').eq('id', id).maybeSingle()
    );
    return data ? videoFromRow(data) : null;
  }

  /** Prochaine position libre dans la série. */
  async nextPosition(seriesId) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select('position')
        .eq('series_id', seriesId)
        .order('position', { ascending: false })
        .limit(1)
    );
    return data.length ? data[0].position + 1 : 1;
  }

  async create(dto) {
    return videoFromRow(
      unwrap(await this.supabase.from(TABLE).insert(toRow(dto)).select().single())
    );
  }

  async update(id, dto) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .update(toRow(dto))
        .eq('id', id)
        .select()
        .maybeSingle()
    );
    return data ? videoFromRow(data) : null;
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }

  /** Compteur de vues via RPC (réservé à la service_role). */
  async incrementViews(id) {
    unwrap(await this.supabase.rpc('increment_video_views', { p_video_id: id }));
  }

  /** Réordonnancement atomique (fonction SQL, une seule transaction). */
  async reorder(seriesId, orderedIds) {
    unwrap(
      await this.supabase.rpc('reorder_videos', {
        p_series_id: seriesId,
        p_video_ids: orderedIds,
      })
    );
  }
}
