import { NotFoundError, ValidationError } from '../../domain/errors/index.js';

const POSTER_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_POSTER_BYTES = 5 * 1024 * 1024;

/**
 * Prépare l'envoi direct navigateur → S3. La clé est TOUJOURS générée ici, à partir
 * des slugs : le client n'envoie jamais de chemin libre.
 */
export default class VideoUploadService {
  constructor(
    seriesRepository,
    videoRepository,
    storage,
    { maxVideoBytes, expiresIn = 900 }
  ) {
    this.seriesRepository = seriesRepository;
    this.videoRepository = videoRepository;
    this.storage = storage;
    this.maxVideoBytes = maxVideoBytes;
    this.expiresIn = expiresIn;
  }

  async createUpload({
    seriesId,
    videoSlug,
    kind = 'video',
    contentType,
    size,
    position,
  }) {
    const series = await this.seriesRepository.findById(seriesId);
    if (!series) throw new NotFoundError('Série introuvable');

    let extension;
    if (kind === 'video') {
      if (contentType !== 'video/mp4')
        throw new ValidationError('Seul le format video/mp4 est accepté');
      if (size > this.maxVideoBytes)
        throw new ValidationError(
          `Fichier trop volumineux (maximum ${Math.round(this.maxVideoBytes / 1024 / 1024)} Mo)`
        );
      extension = 'mp4';
    } else {
      extension = POSTER_TYPES[contentType];
      if (!extension) throw new ValidationError('Affiche : JPEG, PNG ou WebP requis');
      if (size > MAX_POSTER_BYTES)
        throw new ValidationError('Affiche trop volumineuse (5 Mo maximum)');
    }

    const n = String(
      position ?? (await this.videoRepository.nextPosition(series.id))
    ).padStart(2, '0');
    const folder = kind === 'video' ? 'videos' : 'posters';
    const key = `${folder}/${series.slug}/${n}-${videoSlug}.${extension}`;
    const uploadUrl = await this.storage.createUploadUrl(
      key,
      contentType,
      this.expiresIn
    );
    return { uploadUrl, key, expiresIn: this.expiresIn };
  }
}
