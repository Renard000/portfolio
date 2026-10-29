import { Component, createRef } from 'react';
import { connect } from 'react-redux';
import { SPEEDS } from '../../domain/models/Video.js';
import VideoService from '../../bll/services/VideoService.js';
import {
  fetchVideo,
  fetchPlayback,
  registerView,
  clearPlayback,
} from '../store/slices/videosSlice.js';
import {
  savePosition,
  markWatched,
  getResumePosition,
} from '../store/slices/progressSlice.js';
import ErrorBoundary from '../views/components/ErrorBoundary.jsx';
import VideoPlayerView from '../views/pages/client/VideoPlayerView.jsx';

const SAVE_EVERY_MS = 5000;
const MAX_RETRIES = 2;
const isEditable = (el) =>
  el && el.closest && el.closest('input, textarea, select, [contenteditable=true]');

/**
 * Pilote l'élément <video> (Ref) : reprise de lecture, enregistrement de la position (au plus
 * toutes les 5 s et à la pause), raccourcis clavier, URL signée renouvelée en cas d'erreur.
 * Changer de vidéo change la source du MÊME élément : il n'est jamais recréé.
 */
class VideoPlayerController extends Component {
  videoRef = createRef();
  state = { currentTime: 0, speed: 1, ended: false, mediaError: false };
  mounted = false;
  resumeAt = 0;
  lastSave = 0;
  viewCounted = null;
  retries = 0;
  loadToken = 0;

  componentDidMount() {
    this.mounted = true;
    document.addEventListener('keydown', this.handleKey);
    this.loadVideo();
  }

  componentDidUpdate(prev) {
    const { seriesSlug, videoSlug, playbackUrl } = this.props;
    if (prev.seriesSlug !== seriesSlug || prev.videoSlug !== videoSlug) {
      this.saveNow();
      this.setState({ currentTime: 0, ended: false, mediaError: false });
      this.loadVideo();
    } else if (playbackUrl && playbackUrl !== prev.playbackUrl) {
      this.attachSource(playbackUrl);
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.saveNow();
    document.removeEventListener('keydown', this.handleKey);
    const el = this.videoRef.current;
    if (el) {
      // Arrête réellement le téléchargement en cours
      el.removeAttribute('src');
      el.load();
    }
    this.props.clearPlayback();
  }

  async loadVideo() {
    const token = ++this.loadToken;
    this.retries = 0;
    this.viewCounted = null;
    try {
      const { seriesSlug, videoSlug } = this.props;
      const data = await this.props.fetchVideo({ seriesSlug, videoSlug }).unwrap();
      if (!this.mounted || token !== this.loadToken) return;
      this.resumeAt = await this.props
        .getResumePosition({
          videoId: data.video.id,
          duration: data.video.durationSeconds,
        })
        .unwrap();
      await this.props.fetchPlayback(data.video.id).unwrap();
    } catch {
      /* erreur visible dans la vue (state.videos) */
    }
  }

  attachSource(url, force = false) {
    const el = this.videoRef.current;
    if (!el || (!force && el.getAttribute('src') === url)) return;
    el.src = url;
    el.load();
  }

  video() {
    return this.props.data ? this.props.data.video : null;
  }

  // ---------- événements de l'élément <video> ----------
  onLoadedMetadata = () => {
    const el = this.videoRef.current;
    if (this.resumeAt > 0) {
      el.currentTime = this.resumeAt;
      this.resumeAt = 0;
    }
    el.playbackRate = this.state.speed;
  };

  onTimeUpdate = () => {
    const el = this.videoRef.current;
    const t = Math.floor(el.currentTime);
    if (t !== this.state.currentTime) this.setState({ currentTime: t });
    if (Date.now() - this.lastSave >= SAVE_EVERY_MS) this.saveNow();
  };

  onPlay = () => {
    const v = this.video();
    if (v && this.viewCounted !== v.id) {
      this.viewCounted = v.id;
      this.props.registerView(v.id); // statistique anonyme, une fois par vidéo chargée
    }
    this.setState({ ended: false });
  };

  onEnded = () => {
    const v = this.video();
    if (v) this.props.markWatched({ videoId: v.id, duration: v.durationSeconds });
    this.setState({ ended: true });
  };

  onError = () => {
    const el = this.videoRef.current;
    const v = this.video();
    // Retirer la source (démontage, changement de vidéo) déclenche aussi « error » : on l'ignore.
    if (!el || !v || !el.getAttribute('src')) return;
    if (this.retries >= MAX_RETRIES) {
      this.setState({ mediaError: true });
      return;
    }
    // URL expirée (403) ou réseau : on en redemande une et on reprend là où on était.
    this.retries += 1;
    this.resumeAt = el.currentTime || this.state.currentTime;
    this.props
      .fetchPlayback(v.id)
      .unwrap()
      .then(({ url }) => this.mounted && this.attachSource(url, true))
      .catch(() => this.mounted && this.setState({ mediaError: true }));
  };

  retry = () => {
    this.retries = 0;
    this.setState({ mediaError: false });
    const v = this.video();
    if (!v) this.loadVideo();
    else {
      this.resumeAt = this.state.currentTime;
      this.props
        .fetchPlayback(v.id)
        .unwrap()
        .then(({ url }) => this.mounted && this.attachSource(url, true))
        .catch(() => this.mounted && this.setState({ mediaError: true }));
    }
  };

  saveNow = () => {
    const el = this.videoRef.current;
    const v = this.video();
    this.lastSave = Date.now();
    if (!el || !v || !el.getAttribute('src') || !el.currentTime) return;
    this.props.savePosition({
      videoId: v.id,
      seconds: el.currentTime,
      duration: v.durationSeconds,
    });
  };

  // ---------- commandes ----------
  seek = (t) => {
    const el = this.videoRef.current;
    if (el) el.currentTime = t;
  };

  setSpeed = (speed) => {
    const el = this.videoRef.current;
    if (el) el.playbackRate = speed;
    this.setState({ speed });
  };

  handleKey = (e) => {
    const el = this.videoRef.current;
    if (!el || isEditable(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
    const onControl = e.target.closest && e.target.closest('button, a');
    switch (e.key) {
      case ' ':
        if (onControl) return; // la barre d'espace active déjà le bouton ou le lien
        e.preventDefault();
        if (el.paused) el.play();
        else el.pause();
        break;
      case 'ArrowLeft':
        el.currentTime = Math.max(0, el.currentTime - 10);
        break;
      case 'ArrowRight':
        el.currentTime = Math.min(el.duration || Infinity, el.currentTime + 10);
        break;
      case 'f':
      case 'F':
        if (el.requestFullscreen) el.requestFullscreen();
        break;
      case '+':
      case '-': {
        const i = SPEEDS.indexOf(this.state.speed) + (e.key === '+' ? 1 : -1);
        if (i >= 0 && i < SPEEDS.length) this.setSpeed(SPEEDS[i]);
        break;
      }
      default:
    }
  };

  render() {
    const { data, playbackLoading, error } = this.props;
    const v = data ? data.video : null;
    return (
      <ErrorBoundary message="Le lecteur ne peut pas être affiché.">
        <VideoPlayerView
          series={data ? data.series : null}
          video={v}
          previous={data ? data.previous : null}
          next={data ? data.next : null}
          videoRef={this.videoRef}
          speed={this.state.speed}
          currentTime={this.state.currentTime}
          chapterIndex={
            v ? VideoService.currentChapter(v.chapters, this.state.currentTime) : -1
          }
          ended={this.state.ended}
          playbackLoading={playbackLoading}
          error={error || this.props.playbackError}
          mediaError={this.state.mediaError}
          onSeek={this.seek}
          onSpeed={this.setSpeed}
          onRetry={this.retry}
          handlers={{
            onLoadedMetadata: this.onLoadedMetadata,
            onTimeUpdate: this.onTimeUpdate,
            onPause: this.saveNow,
            onPlay: this.onPlay,
            onEnded: this.onEnded,
            onError: this.onError,
          }}
        />
      </ErrorBoundary>
    );
  }
}

// Les paramètres viennent de l'URL (/formations/:seriesSlug/:videoSlug) fournie par le Route.
const mapState = (s, own) => ({
  seriesSlug: own.match.params.seriesSlug,
  videoSlug: own.match.params.videoSlug,
  data: s.videos.player.data,
  error: s.videos.player.error,
  playbackUrl: s.videos.playback.url,
  playbackLoading: s.videos.playback.loading || s.videos.player.loading,
  playbackError: s.videos.playback.error,
});
export default connect(mapState, {
  fetchVideo,
  fetchPlayback,
  registerView,
  clearPlayback,
  savePosition,
  markWatched,
  getResumePosition,
})(VideoPlayerController);
