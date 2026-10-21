import { Component } from 'react';

export default class LoginView extends Component {
  state = { email: '', password: '' };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.email, this.state.password);
  };

  render() {
    const { loading, error } = this.props;
    return (
      <main className="container py-5" style={{ maxWidth: '420px' }}>
        <h1 className="h3 mb-3">Connexion administrateur</h1>
        <form onSubmit={this.submit}>
          <div className="mb-3">
            <label htmlFor="login-email" className="form-label">
              Courriel
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              className="form-control"
              value={this.state.email}
              onChange={(e) => this.setState({ email: e.target.value })}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="login-password" className="form-label">
              Mot de passe
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              className="form-control"
              value={this.state.password}
              onChange={(e) => this.setState({ password: e.target.value })}
              required
            />
          </div>
          {error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : null}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </main>
    );
  }
}
