import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import Video from '../../../../domain/models/Video.js';
import Thumb from '../../components/Thumb.jsx';
import { seriesColor } from '../../components/SeriesCard.jsx';

export default class SeriesPage extends PureComponent {
  render() {
    const { series: s, loading, error, progress } = this.props;
    if (loading && !s)
      return (
        <main className="pf-wrap" style={{ paddingTop: 96 }} role="status">
          <p className="pf-mu">Chargement…</p>
        </main>
      );
    if (error || !s)
      return (
        <main className="pf-wrap" style={{ paddingTop: 96 }}>
          <h1 className="pf-h1 pf-h1--md">
            Série <span className="pf-out">introuvable.</span>
          </h1>
          <p className="pf-lead" style={{ margin: '24px 0' }}>
            {error || 'Cette série n’existe pas.'}
          </p>
          <Link className="pf-btn pf-btn--pri" to="/formations">
            ← Toutes les formations
          </Link>
        </main>
      );
    const resume = progress.nextSlug
      ? s.videos.find((v) => v.slug === progress.nextSlug)
      : null;
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(40px,6vw,80px)' }}>
        <div
          className="pf-split"
          style={{
            display: 'grid',
            gridTemplateColumns: '5fr 7fr',
            gap: 'clamp(32px,6vw,64px)',
            alignItems: 'center',
          }}
        >
          <Thumb
            color={seriesColor(s.slug)}
            kind={0}
            height={380}
            imageUrl={s.posterUrl || s.coverUrl}
            alt={s.title}
          />
          <div className="pf-col" style={{ gap: 20 }}>
            <div className="pf-row">
              <span className="pf-chip is-on" style={{ cursor: 'default' }}>
                {Video.levelLabel(s.level)}
              </span>
              {s.category ? (
                <span className="pf-chip" style={{ cursor: 'default' }}>
                  {s.category}
                </span>
              ) : null}
            </div>
            <h1 className="pf-h1 pf-h1--md">{s.title}</h1>
            {s.description ? <p className="pf-lead">{s.description}</p> : null}
            <div className="pf-row pf-mono" style={{ gap: 24 }}>
              <span>{s.videoCount} vidéos</span>
              <span>{Video.formatTotal(s.totalDurationSeconds)}</span>
              <span>{String(s.language || 'fr').toUpperCase()}</span>
            </div>
            <div
              className="pf-bar"
              role="progressbar"
              aria-label="Progression"
              aria-valuenow={progress.percent}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <i style={{ '--w': `${progress.percent}%` }} />
            </div>
            <div className="pf-row">
              {resume ? (
                <Link
                  className="pf-btn pf-btn--pri"
                  to={`/formations/${s.slug}/${resume.slug}`}
                >
                  ▶ {progress.watchedCount ? 'Reprendre' : 'Commencer'} : vidéo{' '}
                  {resume.position}
                </Link>
              ) : (
                <span className="pf-mono pf-lime">Série terminée ✓</span>
              )}
              <span className="pf-mono">{progress.percent} % terminé</span>
            </div>
          </div>
        </div>

        <section
          className="pf-sec"
          style={{ maxWidth: 960 }}
          aria-labelledby="series-videos"
        >
          <h2
            id="series-videos"
            className="pf-h2"
            style={{ fontSize: '2.5rem', marginBottom: 24 }}
          >
            Vidéos de la série
          </h2>
          <ol
            className="pf-col"
            style={{ gap: 12, listStyle: 'none', padding: 0, margin: 0 }}
          >
            {s.videos.map((v) => {
              const seen = progress.watchedIds.includes(v.id);
              return (
                <li key={v.id}>
                  <Link
                    to={`/formations/${s.slug}/${v.slug}`}
                    className="pf-card pf-row"
                    style={{
                      padding: 14,
                      gap: 18,
                      borderColor:
                        v.slug === progress.nextSlug ? 'var(--pf-lime)' : undefined,
                    }}
                  >
                    <span
                      className={`pf-h3 ${seen ? 'pf-lime' : 'pf-mu'}`}
                      style={{ minWidth: 36 }}
                      aria-label={seen ? 'Vue' : `Vidéo ${v.position}`}
                    >
                      {seen ? '✓' : v.position}
                    </span>
                    <div style={{ width: 120, flexShrink: 0 }}>
                      <Thumb
                        color={seriesColor(s.slug)}
                        kind={0}
                        height={70}
                        imageUrl={v.posterUrl}
                        alt=""
                      />
                    </div>
                    <div className="pf-col" style={{ gap: 2, flex: 1 }}>
                      <b>{v.title}</b>
                      <span className="pf-mono">{v.formattedDuration}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    );
  }
}
SeriesPage.defaultProps = {
  progress: { watchedIds: [], watchedCount: 0, total: 0, percent: 0, nextSlug: null },
};
