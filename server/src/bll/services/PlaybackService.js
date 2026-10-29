import { NotFoundError } from '../../domain/errors/index.js';

const MIN_VALIDITY_SECONDS = 2 * 3600;
const MARGIN_SECONDS = 3600;

/** Émet l'URL CloudFront SIGNÉE : le bucket est privé, rien n'est lisible sans signature. */
export default class PlaybackService {
  constructor(
    videoRepository,
    seriesRepository,
    cdnSigner,
    { clock = () => new Date() } = {}
  ) {
    this.videoRepository = videoRepository;
    this.seriesRepository = seriesRepository;
    this.cdnSigner = cdnSigner;
    this.clock = clock;
  }

  /** Vidéo ET série doivent être publiées. Validité : durée + 1 h, minimum 2 h. */
  async createPlayback(videoId) {
    const video = await this.videoRepository.findById(videoId);
    if (!video || !video.isPublished()) throw new NotFoundError('Vidéo introuvable');
    const series = await this.seriesRepository.findById(video.seriesId);
    if (!series || !series.isPublished()) throw new NotFoundError('Vidéo introuvable');

    const seconds = Math.max(
      video.durationSeconds + MARGIN_SECONDS,
      MIN_VALIDITY_SECONDS
    );
    const expiresAt = new Date(this.clock().getTime() + seconds * 1000);
    const url = await this.cdnSigner.sign(video.videoKey, expiresAt);
    return { url, expiresAt: expiresAt.toISOString() };
  }
}
