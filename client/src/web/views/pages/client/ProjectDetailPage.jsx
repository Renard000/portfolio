import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AnimatedCounter from '../../components/AnimatedCounter.jsx';
import Thumb from '../../components/Thumb.jsx';
import { safeHref } from '../../../utils/url.js';

export default class ProjectDetailPage extends PureComponent {
  render() {
    const { project: p, next } = this.props;
    if (!p)
      return (
        <main className="pf-wrap" style={{ paddingTop: 96 }}>
          <h1 className="pf-h1 pf-h1--md">
            Projet <span className="pf-out">introuvable.</span>
          </h1>
          <p className="pf-lead" style={{ margin: '24px 0' }}>
            Ce projet n’existe pas ou a été retiré.
          </p>
          <Link className="pf-btn pf-btn--pri" to="/projets">
            ← Tous les projets
          </Link>
        </main>
      );
    const live = safeHref(p.liveUrl);
    const code = safeHref(p.githubUrl);
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(40px,6vw,70px)' }}>
        <div className="pf-row pf-mono">
          <Link to="/projets" className="pf-mu">
            Projets
          </Link>
          <span>/</span>
          <span className="pf-lime">{p.title}</span>
        </div>
        <h1 className="pf-h1 pf-h1--md pf-rise" style={{ margin: '24px 0 32px' }}>
          {p.title}
        </h1>
        <div className="pf-row pf-between">
          <div className="pf-row" style={{ gap: 8 }}>
            {p.tech.map((t) => (
              <span key={t} className="pf-k">
                {t}
              </span>
            ))}
          </div>
          <div className="pf-row">
            {live ? (
              <a
                className="pf-btn pf-btn--pri"
                href={live}
                target="_blank"
                rel="noopener noreferrer"
              >
                Voir le site ↗
              </a>
            ) : null}
            {code ? (
              <a className="pf-btn" href={code} target="_blank" rel="noopener noreferrer">
                Code source
              </a>
            ) : null}
          </div>
        </div>
        <div style={{ marginTop: 32 }}>
          <Thumb
            color={p.color}
            kind={p.kind}
            height={520}
            imageUrl={p.imageUrl}
            alt={p.title}
          />
        </div>

        <section className="pf-sec">
          <div
            className="pf-split"
            style={{
              display: 'grid',
              gridTemplateColumns: '4fr 8fr',
              gap: 'clamp(32px,6vw,64px)',
            }}
          >
            <dl className="pf-col" style={{ gap: 20, margin: 0 }}>
              {[
                ['Rôle', p.role],
                ['Durée', p.duration],
                ['Année', p.year],
              ].map(([k, v]) => (
                <div key={k} className="pf-col" style={{ gap: 4 }}>
                  <dt className="pf-mono">{k}</dt>
                  <dd style={{ margin: 0, fontWeight: 700 }}>{v}</dd>
                </div>
              ))}
            </dl>
            <div className="pf-col" style={{ gap: 28 }}>
              <h2 className="pf-h2" style={{ fontSize: '2.5rem' }}>
                Le défi
              </h2>
              <p className="pf-lead" style={{ maxWidth: 'none' }}>
                {p.challenge}
              </p>
              <h2 className="pf-h2" style={{ fontSize: '2.5rem' }}>
                La solution
              </h2>
              <p className="pf-lead" style={{ maxWidth: 'none' }}>
                {p.solution}
              </p>
              {p.results.length ? (
                <div className="pf-grid3">
                  {p.results.map((r) => (
                    <div
                      key={r.label}
                      className="pf-col"
                      style={{
                        gap: 4,
                        borderTop: '1px solid var(--pf-line)',
                        paddingTop: 20,
                      }}
                    >
                      <span className="pf-h2">
                        <AnimatedCounter value={r.value} />
                      </span>
                      <span className="pf-mu">{r.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {next ? (
          <Link
            to={`/projets/${next.slug}`}
            className="pf-card pf-row pf-between"
            style={{ marginTop: 72, padding: 'clamp(24px,4vw,40px)' }}
          >
            <span className="pf-mono">Projet suivant</span>
            <span className="pf-h2">{next.title} →</span>
          </Link>
        ) : null}
      </main>
    );
  }
}
