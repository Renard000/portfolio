export const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default class VideoSeries {
  constructor({
    id,
    title,
    slug,
    description = null,
    coverUrl = null,
    category = null,
    level = 'beginner',
    tags = [],
    language = 'fr',
    status = 'draft',
    featured = false,
    sortOrder = 0,
    createdAt = null,
    videos = [],
  }) {
    Object.assign(this, {
      id,
      title,
      slug,
      description,
      coverUrl,
      category,
      level,
      tags: tags || [],
      language,
      status,
      featured: Boolean(featured),
      sortOrder: sortOrder ?? 0,
      createdAt,
      videos,
    });
  }

  isPublished() {
    return this.status === 'published';
  }

  /** Vidéos publiées, dans l'ordre de position. */
  publishedVideos() {
    return this.videos
      .filter((v) => v.isPublished())
      .sort((a, b) => a.position - b.position);
  }

  totalDurationSeconds(onlyPublished = true) {
    const list = onlyPublished ? this.publishedVideos() : this.videos;
    return list.reduce((sum, v) => sum + v.durationSeconds, 0);
  }

  /** Résumé pour les listes : nombre de vidéos publiées et durée totale. */
  toSummary(baseUrl) {
    const vids = this.publishedVideos();
    const first = vids[0];
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      description: this.description,
      coverUrl: this.coverUrl,
      category: this.category,
      level: this.level,
      tags: this.tags,
      language: this.language,
      featured: this.featured,
      createdAt: this.createdAt,
      videoCount: vids.length,
      totalDurationSeconds: this.totalDurationSeconds(),
      posterUrl: first && baseUrl ? first.posterUrl(baseUrl) : null,
    };
  }
}
