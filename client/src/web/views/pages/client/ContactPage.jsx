import { Component } from 'react';
import { safeHref } from '../../../utils/url.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default class ContactPage extends Component {
  state = { nom: '', email: '', sujet: '', message: '', website: '' };

  set = (key) => (e) => {
    const { value } = e.target;
    this.setState({ [key]: value });
  };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit({ ...this.state });
  };

  reset = () => {
    this.setState({ nom: '', email: '', sujet: '', message: '', website: '' });
    this.props.onReset();
  };

  render() {
    const { profile: p, status, error } = this.props;
    const github = safeHref(p.links.github);
    const linkedin = safeHref(p.links.linkedin);
    return (
      <main className="pf-wrap pf-glow" style={{ paddingTop: 'clamp(48px,8vw,90px)' }}>
        <div
          className="pf-orb"
          style={{
            width: 520,
            height: 520,
            background: 'var(--pf-lime)',
            left: -160,
            top: 200,
          }}
        />
        <div
          className="pf-split"
          style={{
            display: 'grid',
            gridTemplateColumns: '6fr 6fr',
            gap: 'clamp(32px,6vw,80px)',
            alignItems: 'start',
          }}
        >
          <div className="pf-col" style={{ gap: 32 }}>
            <span className="pf-kicker">Contact</span>
            <h1 className="pf-h1 pf-h1--md pf-rise">
              Parlons <span className="pf-out">projet.</span>
            </h1>
            <p className="pf-lead">
              Un mandat, une collaboration, une question : je réponds sous 48 h.
            </p>
            <div className="pf-row">
              <span className="pf-dot" aria-hidden="true" />
              <span>{p.availability}</span>
            </div>
            <div className="pf-col" style={{ gap: 0 }}>
              {EMAIL_RE.test(p.email) ? (
                <a className="pf-lnk" href={`mailto:${p.email}`}>
                  <span className="pf-h3">{p.email}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <span className="pf-lnk">
                  <span className="pf-h3">{p.email}</span>
                </span>
              )}
              {linkedin ? (
                <a
                  className="pf-lnk"
                  href={linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="pf-h3">LinkedIn</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
              {github ? (
                <a
                  className="pf-lnk"
                  href={github}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="pf-h3">GitHub</span>
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </div>

          {status === 'sent' ? (
            <div className="pf-card pf-col" style={{ padding: 36 }} role="status">
              <span
                className="pf-h1 pf-lime"
                style={{ fontSize: '5rem' }}
                aria-hidden="true"
              >
                ✓
              </span>
              <h2 className="pf-h2" style={{ fontSize: '2.2rem' }}>
                Message envoyé.
              </h2>
              <p className="pf-mu">Merci ! Je vous réponds très bientôt.</p>
              <button
                type="button"
                className="pf-btn"
                style={{ alignSelf: 'flex-start' }}
                onClick={this.reset}
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form
              className="pf-card pf-col"
              style={{ padding: 'clamp(24px,4vw,36px)', gap: 20 }}
              onSubmit={this.submit}
              noValidate
              aria-label="Formulaire de contact"
            >
              <div className="pf-grid2" style={{ gap: 16 }}>
                <div>
                  <label htmlFor="c-nom" className="pf-label">
                    Nom
                  </label>
                  <input
                    id="c-nom"
                    className="pf-input"
                    autoComplete="name"
                    value={this.state.nom}
                    onChange={this.set('nom')}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="c-email" className="pf-label">
                    Courriel
                  </label>
                  <input
                    id="c-email"
                    type="email"
                    className="pf-input"
                    autoComplete="email"
                    value={this.state.email}
                    onChange={this.set('email')}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="c-sujet" className="pf-label">
                  Sujet
                </label>
                <input
                  id="c-sujet"
                  className="pf-input"
                  value={this.state.sujet}
                  onChange={this.set('sujet')}
                />
              </div>
              <div>
                <label htmlFor="c-message" className="pf-label">
                  Message
                </label>
                <textarea
                  id="c-message"
                  className="pf-input"
                  value={this.state.message}
                  onChange={this.set('message')}
                  required
                />
              </div>
              {/* Honeypot : invisible pour les humains, rempli par les robots */}
              <div className="visually-hidden" aria-hidden="true">
                <label htmlFor="c-website">Ne pas remplir</label>
                <input
                  id="c-website"
                  name="website"
                  tabIndex="-1"
                  autoComplete="off"
                  value={this.state.website}
                  onChange={this.set('website')}
                />
              </div>
              {error ? (
                <p className="pf-error" role="alert" style={{ margin: 0 }}>
                  {error}
                </p>
              ) : null}
              <div className="pf-row pf-between">
                <span className="pf-mu" style={{ fontSize: 13 }}>
                  Protégé contre le spam.
                </span>
                <button
                  type="submit"
                  className="pf-btn pf-btn--pri"
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Envoi…' : 'Envoyer le message →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    );
  }
}
ContactPage.defaultProps = { status: 'idle' };
