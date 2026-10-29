export default class Video {
  constructor({
    id,
    seriesId,
    title,
    slug,
    description = null,
    videoKey,
    posterKey = null,
    sizeBytes = null,
    durationSeconds,
    position = 1,
    chapters = [],
    resources = [],
    status = 'draft',
    views = 0,
    publishedAt = null,
    createdAt = null,
  }) {
    Object.assign(this, {
      id,
      seriesId,
      title,
      slug,
      description,
      videoKey,
      posterKey,
      sizeBytes: sizeBytes === null || sizeBytes === undefined ? null : Number(sizeBytes),
      durationSeconds,
      position,
      chapters: chapters || [],
      resources: resources || [],
      status,
      views,
      publishedAt,
      createdAt,
    });
  }

  isPublished() {
    return this.status === 'published';
  }

  /** « 26:30 » ou « 1:02:05 ». */
  formattedDuration() {
    const total = Math.max(0, Math.round(this.durationSeconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = String(m).padStart(h ? 2 : 1, '0');
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  /** URL de l'affiche (publique) : base CloudFront + clé. Jamais stockée en base. */
  posterUrl(baseUrl) {
    return this.posterKey ? `${baseUrl.replace(/\/+$/, '')}/${this.posterKey}` : null;
  }

  /** Addendum C : URL directe. Depuis l'addendum E, le lecteur utilise une URL SIGNÉE (PlaybackService). */
  streamUrl(baseUrl) {
    return `${baseUrl.replace(/\/+$/, '')}/${this.videoKey}`;
  }

  /**
   * Version publique : AUCUNE clé S3 (ni video_key ni poster_key) n'est exposée ;
   * la lecture passe par l'endpoint playback.
   */
  toPublic(baseUrl) {
    return {
      id: this.id,
      seriesId: this.seriesId,
      title: this.title,
      slug: this.slug,
      description: this.description,
      durationSeconds: this.durationSeconds,
      formattedDuration: this.formattedDuration(),
      position: this.position,
      chapters: this.chapters,
      resources: this.resources,
      views: this.views,
      publishedAt: this.publishedAt,
      posterUrl: baseUrl ? this.posterUrl(baseUrl) : null,
    };
  }
}
