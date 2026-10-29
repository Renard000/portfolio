import Video from '../../domain/models/Video.js';

const text = (v) => {
  const t = String(v ?? '').trim();
  return t === '' ? null : t;
};

/** Administration des séries et vidéos + envoi direct vers S3. */
export default class VideoAdminService {
  constructor(videoRepository, uploadClient) {
    this.repo = videoRepository;
    this.uploadClient = uploadClient;
  }

  async listSeries() {
    return (await this.repo.listSeriesAdmin()) || [];
  }
  getSeries(id) {
    return this.repo.getSeriesAdmin(id);
  }
  createSeries(dto) {
    return this.repo.createSeries(dto);
  }
  updateSeries(id, dto) {
    return this.repo.updateSeries(id, dto);
  }
  deleteSeries(id) {
    return this.repo.deleteSeries(id);
  }
  createVideo(dto) {
    return this.repo.createVideo(dto);
  }
  updateVideo(id, dto) {
    return this.repo.updateVideo(id, dto);
  }
  deleteVideo(id) {
    return this.repo.deleteVideo(id);
  }
  orderVideos(seriesId, ids) {
    return this.repo.orderVideos(seriesId, ids);
  }

  /**
   * Demande une URL présignée au serveur (qui génère la clé), envoie le fichier puis renvoie la clé.
   * @param {{seriesId, videoSlug, kind, file}} p
   */
  async uploadFile({ seriesId, videoSlug, kind = 'video', file }, options = {}) {
    const { uploadUrl, key } = await this.repo.requestUploadUrl({
      seriesId,
      videoSlug,
      kind,
      contentType: file.type,
      size: file.size,
    });
    await this.uploadClient.upload(uploadUrl, file, file.type, options);
    return key;
  }

  // ---- formulaires (valeurs texte) → corps de requête typés ----

  static validateSeries(v) {
    if (!String(v.title || '').trim()) return 'Le titre est obligatoire.';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(v.slug || '')))
      return 'Slug invalide : minuscules, chiffres et tirets.';
    return null;
  }

  static toSeriesDto(v) {
    return {
      title: v.title.trim(),
      slug: v.slug.trim(),
      description: text(v.description),
      category: text(v.category),
      level: v.level || 'beginner',
      tags: [
        ...new Set(
          String(v.tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        ),
      ],
      language: (text(v.language) || 'fr').toLowerCase(),
      status: v.status || 'draft',
      featured: Boolean(v.featured),
      sortOrder: parseInt(v.sortOrder, 10) || 0,
    };
  }

  /** chapters : [{time:'04:12', label}] ; resources : [{label, url}] */
  static validateVideo(v) {
    if (!String(v.title || '').trim()) return 'Le titre est obligatoire.';
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(v.slug || '')))
      return 'Slug invalide : minuscules, chiffres et tirets.';
    const duration = Video.parseDuration(v.duration);
    if (!duration || duration < 1) return 'Durée invalide (format mm:ss ou h:mm:ss).';
    if (!String(v.videoKey || '').trim() && !v.file)
      return 'Choisissez un fichier vidéo (ou saisissez sa clé S3).';
    let prev = -1;
    for (const c of v.chapters || []) {
      const t = Video.parseDuration(c.time);
      if (t === null) return `Chapitre « ${c.label || '?'} » : temps invalide (mm:ss).`;
      if (!String(c.label || '').trim()) return 'Chaque chapitre doit avoir un libellé.';
      if (t <= prev) return 'Les chapitres doivent avoir des temps croissants.';
      if (t >= duration) return 'Un chapitre dépasse la durée de la vidéo.';
      prev = t;
    }
    return null;
  }

  static toVideoDto(v, keys = {}) {
    return {
      title: v.title.trim(),
      slug: v.slug.trim(),
      description: text(v.description),
      videoKey: keys.videoKey ?? v.videoKey.trim(),
      posterKey: keys.posterKey ?? text(v.posterKey),
      durationSeconds: Video.parseDuration(v.duration),
      chapters: (v.chapters || []).map((c) => ({
        t: Video.parseDuration(c.time),
        label: c.label.trim(),
      })),
      resources: (v.resources || [])
        .filter((r) => r.label.trim() && r.url.trim())
        .map((r) => ({ label: r.label.trim(), url: r.url.trim() })),
      status: v.status || 'draft',
    };
  }

  /** Déplace une vidéo d'un cran (−1 monte, +1 descend) et renvoie la liste d'ids à envoyer. */
  static moveId(videos, id, delta) {
    const ids = videos.map((v) => v.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ids.length) return ids;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    return ids;
  }
}
