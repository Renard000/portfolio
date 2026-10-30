import { Component } from 'react';

/** Réponse à un message de contact, envoyée depuis l'admin avec le gabarit du site. */
export default class ReplyForm extends Component {
  state = { subject: this.props.draft.subject, body: this.props.draft.body };

  set = (key) => (e) => this.setState({ [key]: e.target.value });

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state);
  };

  render() {
    const { message, saving, error, onCancel } = this.props;
    return (
      <form className="row g-3" onSubmit={this.submit}>
        <div className="col-12 small text-muted">
          À : {message.nom} ({message.email})
        </div>
        <div className="col-12">
          <label htmlFor="reply-subject" className="form-label">
            Objet
          </label>
          <input
            id="reply-subject"
            className="form-control"
            value={this.state.subject}
            onChange={this.set('subject')}
            required
          />
        </div>
        <div className="col-12">
          <label htmlFor="reply-body" className="form-label">
            Votre réponse
          </label>
          <textarea
            id="reply-body"
            className="form-control"
            rows="10"
            value={this.state.body}
            onChange={this.set('body')}
            required
          />
          <small className="text-muted">
            Le message reçu est cité automatiquement sous votre réponse.
          </small>
        </div>
        {error ? (
          <div className="col-12">
            <div className="alert alert-danger mb-0" role="alert">
              {error}
            </div>
          </div>
        ) : null}
        <div className="col-12 d-flex gap-2 justify-content-end">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Envoi…' : 'Envoyer la réponse'}
          </button>
        </div>
      </form>
    );
  }
}
