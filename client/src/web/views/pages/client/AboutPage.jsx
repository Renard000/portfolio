import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';
import { safeHref } from '../../../utils/url.js';

export default class AboutPage extends PureComponent {
  render() {
    const { profile: p } = this.props;
    const cv = safeHref(p.cvUrl);
    return (
      <main>
        <section
          className="pf-wrap pf-glow"
          style={{ paddingTop: 'clamp(48px,8vw,90px)' }}
        >
          <div
            className="pf-orb"
            style={{
              width: 460,
              height: 460,
              background: 'var(--pf-vio)',
              right: 0,
              top: 120,
            }}
          />
          <div
            className="pf-split"
            style={{
              display: 'grid',
              gridTemplateColumns: '5fr 7fr',
              gap: 'clamp(32px,6vw,72px)',
              alignItems: 'center',
            }}
          >
            <div
              className="pf-th pf-rise"
              style={{
                '--c': 'var(--pf-s2)',
                '--h': '520px',
                border: '1px solid var(--pf-line)',
              }}
            >
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={`Portrait de ${p.name}`} />
              ) : (
                <span
                  aria-hidden="true"
                  className="pf-h1"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(6rem,14vw,12rem)',
                    color: 'var(--pf-lime)',
                  }}
                >
                  {p.initials}
                </span>
              )}
            </div>
            <div className="pf-col pf-rise pf-d1" style={{ gap: 28 }}>
              <span className="pf-kicker">À propos</span>
              <h1 className="pf-h1 pf-h1--md">
                Je construis des interfaces qu’on{' '}
                <span className="pf-out">n’oublie pas.</span>
              </h1>
              <p className="pf-lead">{p.bio}</p>
              <div className="pf-row">
                {cv ? (
                  <a
                    className="pf-btn pf-btn--pri"
                    href={cv}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Télécharger le CV ↗
                  </a>
                ) : null}
                <Link className={cv ? 'pf-btn' : 'pf-btn pf-btn--pri'} to="/contact">
                  Me contacter
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="pf-wrap pf-sec">
          <div className="pf-grid2" style={{ gap: 'clamp(32px,6vw,72px)' }}>
            <div className="pf-col" style={{ gap: 24 }}>
              <h2 className="pf-h2">Compétences</h2>
              {p.skills.map((s) => (
                <div key={s.name} className="pf-col" style={{ gap: 8 }}>
                  <div className="pf-row pf-between">
                    <b>{s.name}</b>
                    <span className="pf-mono">{s.level} %</span>
                  </div>
                  <div
                    className="pf-bar"
                    role="progressbar"
                    aria-label={s.name}
                    aria-valuenow={s.level}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <i style={{ '--w': `${s.level}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="pf-col">
              <h2 className="pf-h2" style={{ marginBottom: 16 }}>
                Parcours
              </h2>
              {p.timeline.map((t) => (
                <RevealOnScroll key={t.period + t.title}>
                  <div className="pf-lnk" style={{ alignItems: 'flex-start', gap: 32 }}>
                    <span className="pf-mono pf-lime" style={{ minWidth: 110 }}>
                      {t.period}
                    </span>
                    <div className="pf-col" style={{ gap: 4, flex: 1 }}>
                      <b className="pf-h3">{t.title}</b>
                      <span className="pf-mu">{t.detail}</span>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>

        <section className="pf-wrap pf-sec" aria-label="Valeurs">
          <div className="pf-grid3">
            {p.values.map((v, i) => (
              <RevealOnScroll key={v.title}>
                <div className="pf-card pf-col pf-card--lift" style={{ height: '100%' }}>
                  <span className="pf-h2 pf-lime">{String(i + 1).padStart(2, '0')}</span>
                  <b className="pf-h3">{v.title}</b>
                  <span className="pf-mu">{v.detail}</span>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </section>
      </main>
    );
  }
}
