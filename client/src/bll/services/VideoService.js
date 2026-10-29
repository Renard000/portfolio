import Video from '../../domain/models/Video.js';

/** Lecture publique des formations (+ calculs d'affichage purs). */
export default class VideoService {
  constructor(videoRepository) {
    this.repo = videoRepository;
  }

  async listSeries(params = {}) {
    const r = await this.repo.listSeries(params);
    return {
      items: (r && r.items) || [],
      total: (r && r.total) || 0,
      page: (r && r.page) || 1,
    };
  }
  getSeries(slug) {
    return this.repo.getSeries(slug);
  }
  getVideo(seriesSlug, videoSlug) {
    return this.repo.getVideo(seriesSlug, videoSlug);
  }
  getPlayback(videoId) {
    return this.repo.playback(videoId);
  }
  /** Statistique anonyme : une erreur ne doit jamais gêner la lecture. */
  async registerView(videoId) {
    try {
      await this.repo.registerView(videoId);
    } catch {
      /* ignoré */
    }
  }

  /** Précédente / suivante / chapitre courant : calculs purs. */
  static currentChapter(chapters, time) {
    return Video.chapterIndexAt(chapters, time);
  }

  /** Paramètres de l'API : on retire les filtres vides ou « all ». */
  static toQuery({ category, level, tag, q } = {}) {
    const out = {};
    if (category && category !== 'all') out.category = category;
    if (level && level !== 'all') out.level = level;
    if (tag) out.tag = tag;
    if (q && q.trim()) out.q = q.trim();
    return out;
  }
}
