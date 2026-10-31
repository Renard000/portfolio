import { Component } from 'react';
import withLocale from '../../context/withLocale.jsx';

class NewsletterForm extends Component {
  state = { email: '', consent: false, website: '' };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit({ ...this.state });
  };

  render() {
    const { status, error } = this.props;
    if (status === 'pending')
      return (
        <div className="alert alert-success" role="status">
          {this.props.t(
            "Merci ! Un courriel de confirmation vous a été envoyé : cliquez sur le lien qu'il contient pour finaliser votre abonnement. Sans ce clic, vous ne recevrez rien."
          )}
        </div>
      );
    return (
      <form
        onSubmit={this.submit}
        noValidate
        aria-label={this.props.t('Abonnement à la newsletter')}
      >
        <div className="input-group mb-2">
          <label htmlFor="nl-email" className="visually-hidden">
            {this.props.t('Adresse courriel')}
          </label>
          <input
            id="nl-email"
            type="email"
            className="form-control"
            placeholder={this.props.t('vous@exemple.com')}
            autoComplete="email"
            value={this.state.email}
            onChange={(e) => this.setState({ email: e.target.value })}
            required
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? this.props.t('Envoi…') : this.props.t("S'abonner")}
          </button>
        </div>
        {/* Honeypot : invisible pour les humains, rempli par les robots */}
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="nl-website">{this.props.t('Ne pas remplir')}</label>
          <input
            id="nl-website"
            name="website"
            type="text"
            tabIndex="-1"
            autoComplete="off"
            value={this.state.website}
            onChange={(e) => this.setState({ website: e.target.value })}
          />
        </div>
        <div className="form-check">
          <input
            id="nl-consent"
            type="checkbox"
            className="form-check-input"
            checked={this.state.consent}
            onChange={(e) => this.setState({ consent: e.target.checked })}
          />
          <label htmlFor="nl-consent" className="form-check-label small">
            {this.props.t(
              "J'accepte de recevoir par courriel les nouvelles publications de ce portfolio. Je peux me désabonner à tout moment grâce au lien présent dans chaque courriel."
            )}
          </label>
        </div>
        {error ? (
          <p className="text-danger small mt-2 mb-0" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    );
  }
}

export default withLocale(NewsletterForm);
