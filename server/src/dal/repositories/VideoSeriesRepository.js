import VideoSeries from '../../domain/entities/VideoSeries.js';
import { unwrap } from '../unwrap.js';
import { videoFromRow } from './VideoRepository.js';

const TABLE = 'video_series';

const fromRow = (r) =>
  new VideoSeries({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description,
    coverUrl: r.cover_url,
    category: r.category,
    level: r.level,
    tags: r.tags,
    language: r.language,
    status: r.status,
    featured: r.featured,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
    videos: (r.videos || []).map(videoFromRow),
  });

const toRow = (d) => {
  const map = {
    title: 'title',
    slug: 'slug',
    description: 'description',
    coverUrl: 'cover_url',
    category: 'category',
    level: 'level',
    tags: 'tags',
    language: 'language',
    status: 'status',
    featured: 'featured',
    sortOrder: 'sort_order',
  };
  const row = {};
  for (const [k, col] of Object.entries(map)) if (d[k] !== undefined) row[col] = d[k];
  return row;
};

const WITH_VIDEOS = '*, videos(*)';
const BY_POSITION = { referencedTable: 'videos', ascending: true };

export default class VideoSeriesRepository {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /** Séries avec leurs vidéos. includeDrafts=false : séries publiées uniquement. */
  async list({ includeDrafts = false } = {}) {
    let q = this.supabase.from(TABLE).select(WITH_VIDEOS);
    if (!includeDrafts) q = q.eq('status', 'published');
    const data = unwrap(
      await q
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .order('position', BY_POSITION)
    );
    return data.map(fromRow);
  }

  async findBySlug(slug) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select(WITH_VIDEOS)
        .eq('slug', slug)
        .order('position', BY_POSITION)
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async findById(id) {
    const data = unwrap(
      await this.supabase
        .from(TABLE)
        .select(WITH_VIDEOS)
        .eq('id', id)
        .order('position', BY_POSITION)
        .maybeSingle()
    );
    return data ? fromRow(data) : null;
  }

  async create(dto) {
    return fromRow(
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
    return data ? fromRow(data) : null;
  }

  async delete(id) {
    const data = unwrap(
      await this.supabase.from(TABLE).delete().eq('id', id).select('id')
    );
    return data.length > 0;
  }
}
