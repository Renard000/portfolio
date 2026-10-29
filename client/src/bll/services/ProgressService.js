const WATCHED_RATIO = 0.95;
const RESTART_WINDOW = 10; // à moins de 10 s de la fin, on repart du début

/** Progression de l'élève (pourcentage, reprise, prochaine vidéo non vue). */
export default class ProgressService {
  constructor(progressRepository) {
    this.repo = progressRepository;
  }

  /** Enregistre la position ; au-delà de 95 % la vidéo est considérée comme vue. */
  savePosition(videoId, seconds, duration) {
    const previous = this.repo.get(videoId) || {};
    const watched =
      Boolean(previous.watched) || (duration > 0 && seconds / duration >= WATCHED_RATIO);
    this.repo.set(videoId, {
      position: Math.max(0, Math.floor(seconds)),
      duration,
      watched,
    });
  }

  markWatched(videoId, duration) {
    const previous = this.repo.get(videoId) || {};
    this.repo.set(videoId, {
      position: 0,
      duration: duration ?? previous.duration,
      watched: true,
    });
  }

  isWatched(videoId) {
    const p = this.repo.get(videoId);
    return Boolean(p && p.watched);
  }

  /** Seconde de reprise : 0 si jamais lue, terminée ou presque finie. */
  resumePosition(videoId, duration) {
    const p = this.repo.get(videoId);
    if (!p || !p.position || p.watched) return 0;
    if (duration && p.position >= duration - RESTART_WINDOW) return 0;
    return p.position;
  }

  /** { watchedCount, total, percent, nextVideo } pour une liste de vidéos de la série. */
  seriesProgress(videos) {
    const total = videos.length;
    const watchedCount = videos.filter((v) => this.isWatched(v.id)).length;
    return {
      watchedCount,
      total,
      percent: total ? Math.round((watchedCount / total) * 100) : 0,
      nextVideo: videos.find((v) => !this.isWatched(v.id)) || null,
    };
  }
}
