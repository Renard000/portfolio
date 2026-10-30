import { NotFoundError, ValidationError } from '../../domain/errors/index.js';
import Publication from '../../domain/entities/Publication.js';
import { normalize } from './CertificationService.js';

const DEFAULT_LIMIT = 12;
const isDuplicate = (err) => /duplicate key|unique/i.test(err.message || '');

/** Chapitres : t croissant strictement et inférieur à la durée. */
export function validateChapters(chapters, durationSeconds) {
  let prev = -1;
  for (const c of chapters || []) {
    if (c.t <= prev)
      throw new ValidationError('Les chapitres doivent avoir des temps croissants');
    if (c.t >= durationSeconds)
      throw new ValidationError('Un chapitre dépasse la durée de la vidéo');
    prev = c.t;
  }
}

export default class VideoService {
  constructor(seriesRepository, videoRepository, storage, publications, options = {}) {
    this.seriesRepository = seriesRepository;
    this.videoRepository = videoRepository;
    this.storage = storage;
    this.publications = publications;
    this.cdnUrl = options.cdnUrl || '';
    this.logger = options.logger || console;
    this.clock = options.clock || (() => new Date());
  }

  // ---------------- Public ----------------

  /** Séries publiées ayant au moins une vidéo publiée, filtrées et paginées (20 max par page). */
  async listSeries({
    category,
    level,
    tag,
    q,
    sort,
    page = 1,
    limit = DEFAULT_LIMIT,
  } = {}) {
    let list = (await this.seriesRepository.list({ includeDrafts: false })).filter(
      (s) => s.isPublished() && s.publishedVideos().length > 0
    );
    if (category)
      list = list.filter((s) => normalize(s.category) === normalize(category));
    if (level) list = list.filter((s) => s.level === level);
    if (tag)
      list = list.filter((s) => s.tags.some((t) => normalize(t) === normalize(tag)));
    if (q) {
      const needle = normalize(q);
      list = list.filter((s) =>
        [s.title, s.description, s.category, ...s.tags].some((f) =>
          normalize(f).includes(needle)
        )
      );
    }
    if (sort === 'recent')
      list = [...list].sort((a, b) =>
        String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? ''))
      );
    const size = Math.min(limit, 20);
    const items = list
      .slice((page - 1) * size, page * size)
      .map((s) => s.toSummary(this.cdnUrl));
    return { items, page, limit: size, total: list.length };
  }

  async #publishedSeries(slug) {
    const series = await this.seriesRepository.findBySlug(slug);
    if (!series || !series.isPublished()) throw new NotFoundError('Série introuvable');
    return series;
  }

  async getSeries(slug) {
    const series = await this.#publishedSeries(slug);
    return {
      ...series.toSummary(this.cdnUrl),
      videos: series.publishedVideos().map((v) => v.toPublic(this.cdnUrl)),
    };
  }

  /** Vidéo + précédente / suivante, calculées à partir de la position. */
  async getVideo(seriesSlug, videoSlug) {
    const series = await this.#publishedSeries(seriesSlug);
    const vids = series.publishedVideos();
    const i = vids.findIndex((v) => v.slug === videoSlug);
    if (i < 0) throw new NotFoundError('Vidéo introuvable');
    const brief = (v) => (v ? { slug: v.slug, title: v.title } : null);
    return {
      series: { title: series.title, slug: series.slug },
      video: vids[i].toPublic(this.cdnUrl),
      previous: brief(vids[i - 1]),
      next: brief(vids[i + 1]),
    };
  }

  /** Le SQL ne compte que les vidéos publiées : un id inconnu ou en brouillon n'a aucun effet. */
  async registerView(id) {
    await this.videoRepository.incrementViews(id);
  }

  // ---------------- Admin : séries ----------------

  async listSeriesAdmin() {
    const list = await this.seriesRepository.list({ includeDrafts: true });
    return list.map((s) => ({
      id: s.id,
      title: s.title,
      slug: s.slug,
      category: s.category,
      level: s.level,
      status: s.status,
      featured: s.featured,
      sortOrder: s.sortOrder,
      videoCount: s.videos.length,
      publishedCount: s.publishedVideos().length,
      totalDurationSeconds: s.totalDurationSeconds(),
    }));
  }

  /** Série complète avec TOUTES les vidéos (clés S3 incluses : réservé à l'admin). */
  async getSeriesAdmin(id) {
    const series = await this.seriesRepository.findById(id);
    if (!series) throw new NotFoundError('Série introuvable');
    return series;
  }

  async createSeries(dto) {
    try {
      return await this.seriesRepository.create(dto);
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de série est déjà utilisé');
      throw err;
    }
  }

  async updateSeries(id, dto) {
    try {
      const current = await this.seriesRepository.findById(id);
      const updated = await this.seriesRepository.update(id, dto);
      if (!updated) throw new NotFoundError('Série introuvable');
      // Une série n'est visible qu'avec au moins une vidéo publiée
      const goingLive =
        updated.isPublished() &&
        !current.isPublished() &&
        current.publishedVideos().length > 0;
      if (goingLive && this.publications)
        await this.publications.notify(Publication.fromSeries(updated));
      if (current.isPublished() && !updated.isPublished()) {
        await this.#retract('series', id);
        for (const v of current.videos) await this.#retract('video', v.id);
      }
      return updated;
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de série est déjà utilisé');
      throw err;
    }
  }

  /** Supprime la série (les vidéos suivent en cascade) puis ses fichiers S3, au mieux. */
  async deleteSeries(id) {
    const series = await this.seriesRepository.findById(id);
    if (!series) throw new NotFoundError('Série introuvable');
    await this.seriesRepository.delete(id);
    await this.#retract('series', id);
    for (const v of series.videos) {
      await this.#retract('video', v.id);
      await this.#removeFiles(v);
    }
  }

  // ---------------- Admin : vidéos ----------------

  async #checkFile(key, expectedFolder, label) {
    if (!key.startsWith(expectedFolder))
      throw new ValidationError(`${label} : la clé doit commencer par ${expectedFolder}`);
    const found = await this.storage.exists(key);
    if (!found) throw new ValidationError(`${label} introuvable dans le bucket`);
    return found;
  }

  async #removeFiles(video) {
    for (const key of [video.videoKey, video.posterKey].filter(Boolean)) {
      try {
        await this.storage.remove(key);
      } catch (err) {
        this.logger.error(`[videos] suppression S3 échouée (${key}) : ${err.message}`);
      }
    }
  }

  async #retract(kind, id) {
    if (this.publications) await this.publications.retract({ kind, id });
  }

  async #notifyIfLive(video, series) {
    if (!this.publications || !series.isPublished()) return;
    await this.publications.notify(Publication.fromVideo(video, series));
  }

  async createVideo(dto) {
    const series = await this.seriesRepository.findById(dto.seriesId);
    if (!series) throw new NotFoundError('Série introuvable');
    validateChapters(dto.chapters, dto.durationSeconds);
    // Le serveur vérifie que le fichier existe vraiment et lit sa taille réelle.
    const file = await this.#checkFile(
      dto.videoKey,
      `videos/${series.slug}/`,
      'Fichier vidéo'
    );
    if (dto.posterKey)
      await this.#checkFile(dto.posterKey, `posters/${series.slug}/`, 'Affiche');
    const status = dto.status || 'draft';
    let video;
    try {
      video = await this.videoRepository.create({
        ...dto,
        status,
        sizeBytes: file.size,
        position: await this.videoRepository.nextPosition(series.id),
        publishedAt: status === 'published' ? this.clock().toISOString() : null,
      });
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de vidéo existe déjà dans la série');
      throw err;
    }
    if (status === 'published') await this.#notifyIfLive(video, series);
    return video;
  }

  async updateVideo(id, dto) {
    const current = await this.videoRepository.findById(id);
    if (!current) throw new NotFoundError('Vidéo introuvable');
    const series = await this.seriesRepository.findById(current.seriesId);
    const next = { ...dto };
    validateChapters(
      dto.chapters ?? current.chapters,
      dto.durationSeconds ?? current.durationSeconds
    );
    if (dto.videoKey && dto.videoKey !== current.videoKey) {
      const file = await this.#checkFile(
        dto.videoKey,
        `videos/${series.slug}/`,
        'Fichier vidéo'
      );
      next.sizeBytes = file.size;
    }
    if (dto.posterKey && dto.posterKey !== current.posterKey)
      await this.#checkFile(dto.posterKey, `posters/${series.slug}/`, 'Affiche');
    const goingLive = dto.status === 'published' && current.status !== 'published';
    if (goingLive) next.publishedAt = this.clock().toISOString();
    if (dto.status === 'draft') next.publishedAt = null;
    let updated;
    try {
      updated = await this.videoRepository.update(id, next);
    } catch (err) {
      if (isDuplicate(err))
        throw new ValidationError('Ce slug de vidéo existe déjà dans la série');
      throw err;
    }
    if (!updated) throw new NotFoundError('Vidéo introuvable');
    if (goingLive) await this.#notifyIfLive(updated, series);
    if (dto.status === 'draft' && current.status === 'published')
      await this.#retract('video', id);
    return updated;
  }

  async deleteVideo(id) {
    const video = await this.videoRepository.findById(id);
    if (!video) throw new NotFoundError('Vidéo introuvable');
    await this.videoRepository.delete(id);
    await this.#retract('video', id);
    await this.#removeFiles(video);
  }

  /** Ordre complet des vidéos d'une série, appliqué en une transaction (fonction SQL). */
  async orderVideos(seriesId, videoIds) {
    try {
      await this.videoRepository.reorder(seriesId, videoIds);
    } catch (err) {
      if (/Ordre invalide/.test(err.message))
        throw new ValidationError(
          'La liste doit contenir exactement les vidéos de la série'
        );
      throw err;
    }
    return this.getSeriesAdmin(seriesId);
  }
}
