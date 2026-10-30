import { Component } from 'react';

import { Link } from 'react-router-dom';

import Video, { SPEEDS } from '../../../../domain/models/Video.js';

/** Présentation du lecteur. L'élément <video> est piloté par le contrôleur via videoRef. */

export default class VideoPlayerView extends Component {
  chapterRefs = [];

  componentDidUpdate(prevProps) {
    if (prevProps.chapterIndex !== this.props.chapterIndex) {
      const el = this.chapterRefs[this.props.chapterIndex];

      if (el && typeof el.scrollIntoView === 'function')
        el.scrollIntoView({ block: 'nearest' });
    }
  }

  blockContextMenu = (e) => e.preventDefault();

  render() {
    const {
      series,
      video,
      previous,
      next,
      videoRef,
      speed,
      currentTime,
      chapterIndex,
      ended,
      playbackLoading,
      error,
      mediaError,
    } = this.props;

    const { onSeek, onSpeed, onRetry, handlers } = this.props;

    this.chapterRefs = [];

    const base = series ? `/formations/${series.slug}` : '/formations';

    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(24px,4vw,48px)' }}>
        <div className="pf-row pf-mono" style={{ marginBottom: 20 }}>
          <Link to="/formations" className="pf-mu">
            Formations
          </Link>

          <span>/</span>

          {series ? (
            <Link to={base} className="pf-mu">
              {series.title}
            </Link>
          ) : null}

          <span>/</span>

          <span className="pf-lime">{video ? video.title : '…'}</span>
        </div>

        <div className="pf-split-player">
          <div className="pf-col" style={{ gap: 24 }}>
            <div className="pf-player">
              {/* Dissuasion côté navigateur : ni téléchargement, ni cast, ni menu contextuel */}

              <video
                ref={videoRef}

                controls

                preload="metadata"

                playsInline

                poster={video && video.posterUrl ? video.posterUrl : undefined}

                controlsList="nodownload noremoteplayback"

                disablePictureInPicture

                disableRemotePlayback

                onContextMenu={this.blockContextMenu}

                aria-label={video ? video.title : 'Lecteur vidéo'}

                {...handlers}
              />

              {error || mediaError ? (
                <div className="pf-player__overlay" role="alert">
                  <b>{mediaError ? 'La lecture a échoué.' : error}</b>

                  <button type="button" className="pf-btn pf-btn--pri" onClick={onRetry}>
                    Réessayer
                  </button>
                </div>
              ) : null}

              {ended ? (
                <div className="pf-player__overlay">
                  <b>
                    {next ? 'Vidéo terminée ✓' : 'Dernière vidéo de la série terminée ✓'}
                  </b>

                  {next ? (
                    <Link className="pf-btn pf-btn--pri" to={`${base}/${next.slug}`}>
                      Vidéo suivante : {next.title} ›
                    </Link>
                  ) : (
                    <Link className="pf-btn pf-btn--pri" to={base}>
                      Retour à la série
                    </Link>
                  )}
                </div>
              ) : null}
            </div>

            {playbackLoading ? (
              <span className="pf-mono" role="status">
                Préparation de la lecture…
              </span>
            ) : null}

            <h1 className="pf-h2" style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)' }}>
              {video ? video.title : ''}
            </h1>

            <div
              className="pf-row"

              style={{ gap: 10 }}

              role="group"

              aria-label="Vitesse de lecture"
            >
              <span className="pf-mono">Vitesse</span>

              {SPEEDS.map((v) => (
                <button
                  key={v}

                  type="button"

                  className={`pf-chip ${v === speed ? 'is-on' : ''}`}

                  aria-pressed={v === speed}

                  onClick={() => onSpeed(v)}
                >
                  {String(v).replace('.', ',')}×
                </button>
              ))}
            </div>

            <p className="pf-mono" style={{ margin: 0 }}>
              Raccourcis : espace · ← → ±10 s · F plein écran · + − vitesse
            </p>

            {video && video.description ? (
              <p className="pf-mu" style={{ margin: 0, whiteSpace: 'pre-line' }}>
                {video.description}
              </p>
            ) : null}

            <div className="pf-grid2">
              {video && video.resources.length ? (
                <div className="pf-card pf-col" style={{ gap: 0 }}>
                  <span className="pf-kicker" style={{ marginBottom: 8 }}>
                    Ressources
                  </span>

                  {video.resources.map((r) => (
                    <a
                      key={r.url}

                      className="pf-lnk"

                      href={r.url}

                      target="_blank"

                      rel="noopener noreferrer"
                    >
                      <span>{r.label}</span>

                      <span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              ) : null}

              <div className="pf-card pf-row pf-between">
                {previous ? (
                  <Link className="pf-btn" to={`${base}/${previous.slug}`}>
                    ‹ Précédente
                  </Link>
                ) : (
                  <span />
                )}

                {next ? (
                  <Link className="pf-btn pf-btn--pri" to={`${base}/${next.slug}`}>
                    Suivante ›
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>

          <aside
            className="pf-card pf-col"

            style={{ alignSelf: 'start', gap: 4 }}

            aria-label="Chapitres"
          >
            <span className="pf-kicker" style={{ marginBottom: 8 }}>
              Chapitres
            </span>

            {video && video.chapters.length ? (
              <div className="pf-chapters">
                {video.chapters.map((c, i) => (
                  <button
                    key={c.t}

                    type="button"

                    ref={(el) => (this.chapterRefs[i] = el)}

                    className={`pf-chapter ${i === chapterIndex ? 'is-current' : ''}`}

                    aria-current={i === chapterIndex ? 'true' : undefined}

                    onClick={() => onSeek(c.t)}
                  >
                    <span className="pf-mono pf-lime" style={{ minWidth: 52 }}>
                      {Video.formatDuration(c.t)}
                    </span>

                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="pf-mu">Cette vidéo n’a pas de chapitres.</span>
            )}

            <span className="pf-mono" style={{ marginTop: 12 }}>
              {Video.formatDuration(currentTime)} /{' '}
              {video ? video.formattedDuration : '--:--'}
            </span>
          </aside>
        </div>
      </main>
    );
  }
}

VideoPlayerView.defaultProps = { speed: 1, currentTime: 0, chapterIndex: -1 };
