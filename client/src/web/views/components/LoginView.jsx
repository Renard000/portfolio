import { Component } from 'react';

/** Connexion administrateur (maquette A-01). */
export default class LoginView extends Component {
  state = { email: '', password: '' };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.email, this.state.password);
  };

  render() {
    const { initials, loading, error } = this.props;
    return (
      <main className="pf-login">
        <div
          className="pf-orb"
          style={{
            width: 520,
            height: 520,
            background: 'var(--pf-vio)',
            left: -120,
            top: 100,
          }}
          aria-hidden="true"
        />
        <div
          className="pf-orb"
          style={{
            width: 420,
            height: 420,
            background: 'var(--pf-lime)',
            right: -80,
            bottom: 60,
          }}
          aria-hidden="true"
        />
        <form
          className="pf-card pf-col pf-rise"
          style={{ gap: 22 }}
          onSubmit={this.submit}
        >
          <span className="pf-logo">
            {initials}
            <i>.</i>{' '}
            <span className="pf-mono" style={{ color: 'var(--pf-vio)' }}>
              admin
            </span>
          </span>
          <h1
            className="pf-h2"
            style={{ fontSize: 40 }}
            aria-label="Connexion administrateur"
          >
            Connexion
          </h1>
          <div>
            <label htmlFor="login-email" className="pf-label">
              Courriel
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className="pf-input"
              placeholder="admin@exemple.com"
              value={this.state.email}
              onChange={(e) => this.setState({ email: e.target.value })}
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="pf-label">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="pf-input"
              value={this.state.password}
              onChange={(e) => this.setState({ password: e.target.value })}
              required
            />
          </div>
          {error ? (
            <p className="pf-error" role="alert" style={{ margin: 0 }}>
              {error}
            </p>
          ) : null}
          <button type="submit" className="pf-btn pf-btn--pri" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <span className="pf-mu" style={{ fontSize: 13 }}>
            Inscriptions publiques désactivées.
          </span>
        </form>
      </main>
    );
  }
}
