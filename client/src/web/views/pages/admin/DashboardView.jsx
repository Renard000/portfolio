import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader.jsx';
import AnimatedCounter from '../../components/AnimatedCounter.jsx';

/** Tableau de bord (maquette A-02) : reçoit des valeurs déjà calculées par le contrôleur. */
export default class DashboardView extends PureComponent {
  stat(label, value, note) {
    return (
      <div className="pf-card pf-col" style={{ gap: 6 }}>
        <span className="pf-mono">{label}</span>
        <span className="pf-stat">
          <AnimatedCounter value={value} />
        </span>
        <span className="pf-lime" style={{ fontSize: 14 }}>
          {note}
        </span>
      </div>
    );
  }

  render() {
    const { data, loading, error, onRetry } = this.props;
    if (!data)
      return (
        <section className="pf-col">
          <AdminHeader title="Tableau de bord" />
          {error ? (
            <div
              className="pf-card pf-col"
              role="alert"
              style={{ alignItems: 'flex-start' }}
            >
              <p className="pf-error" style={{ margin: 0 }}>
                {error}
              </p>
              <button type="button" className="pf-btn" onClick={onRetry}>
                Réessayer
              </button>
            </div>
          ) : (
            <p className="pf-mu" role="status">
              {loading ? 'Chargement…' : ''}
            </p>
          )}
        </section>
      );
    const { stats, bars, todo, topArticles, topVideos, videoDuration } = data;
    return (
      <section className="pf-col" style={{ gap: 24 }}>
        <AdminHeader title="Tableau de bord" />
        <div className="pf-grid4">
          {this.stat('Vues (30 j)', stats.views, stats.viewsNote)}
          {this.stat('Articles publiés', stats.published, stats.draftsNote)}
          {this.stat('Messages non lus', stats.unread, 'à traiter')}
          {this.stat('Abonnés confirmés', stats.subscribers, stats.subscribersNote)}
        </div>

        <div className="pf-dash-split">
          <div className="pf-card pf-col">
            <div className="pf-row pf-between">
              <h2 className="pf-h3">Vues par mois</h2>
              <span className="pf-chip">12 mois</span>
            </div>
            <div
              className="pf-bars"
              role="img"
              aria-label={`Vues par mois : ${bars.map((b) => `${b.label} ${b.views}`).join(', ')}`}
            >
              {bars.map((b, i) => (
                <div
                  key={b.key}
                  className={`pf-bars__bar${b.peak ? ' is-peak' : ''}`}
                  style={{ height: `${b.height}%`, animationDelay: `${i * 0.08}s` }}
                  title={`${b.label} : ${b.views} vues`}
                />
              ))}
            </div>
            <div className="pf-row pf-between pf-mono">
              <span>{bars.length ? bars[0].label : ''}</span>
              <span>{bars.length ? bars[bars.length - 1].label : ''}</span>
            </div>
          </div>
          <div className="pf-card pf-col">
            <h2 className="pf-h3">À traiter</h2>
            {todo.map((t) => (
              <Link key={t.to} className="pf-lnk" to={t.to} style={{ color: 'inherit' }}>
                <span>{t.label}</span>
                <span className="pf-lime" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
            {!todo.length ? <p className="pf-mu">Rien à traiter.</p> : null}
          </div>
        </div>

        <div className="pf-grid2">
          <div className="pf-card pf-col">
            <h2 className="pf-h3">Articles les plus lus</h2>
            {topArticles.map((a) => (
              <div key={a.id} className="pf-lnk">
                <span>{a.title}</span>
                <span className="pf-mono">{a.views}</span>
              </div>
            ))}
            {!topArticles.length ? <p className="pf-mu">Aucun article publié.</p> : null}
          </div>
          <div className="pf-card pf-col">
            <h2 className="pf-h3">
              Vidéos les plus vues · durée publiée {videoDuration}
            </h2>
            {topVideos.map((v) => (
              <div key={v.id} className="pf-lnk">
                <span>{v.title}</span>
                <span className="pf-mono">{v.views}</span>
              </div>
            ))}
            {!topVideos.length ? <p className="pf-mu">Aucune vidéo publiée.</p> : null}
          </div>
        </div>
      </section>
    );
  }
}
