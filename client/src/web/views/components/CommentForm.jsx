import { Component } from 'react';
import withLocale from '../../context/withLocale.jsx';

/** Formulaire de commentaire (maquette P-05) : publié après modération, honeypot invisible. */
class CommentForm extends Component {
  state = { author: '', content: '', website: '' };

  set = (key) => (e) => this.setState({ [key]: e.target.value });

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit({ ...this.state });
  };

  render() {
    const { status, error } = this.props;
    if (status === 'pending')
      return (
        <div className="pf-card" role="status">
          {this.props.t('Merci ! Votre commentaire sera publié après modération.')}
        </div>
      );
    return (
      <form
        className="pf-card pf-col"
        style={{ gap: 14 }}
        onSubmit={this.submit}
        aria-label={this.props.t('Ajouter un commentaire')}
      >
        <div>
          <label htmlFor="comment-author" className="visually-hidden">
            {this.props.t('Votre nom')}
          </label>
          <input
            id="comment-author"
            className="pf-input"
            placeholder={this.props.t('Votre nom')}
            autoComplete="name"
            maxLength={80}
            required
            value={this.state.author}
            onChange={this.set('author')}
          />
        </div>
        <div>
          <label htmlFor="comment-content" className="visually-hidden">
            {this.props.t('Votre commentaire')}
          </label>
          <textarea
            id="comment-content"
            className="pf-input"
            style={{ minHeight: 110 }}
            placeholder={this.props.t('Votre commentaire…')}
            maxLength={2000}
            required
            value={this.state.content}
            onChange={this.set('content')}
          />
        </div>
        {/* Honeypot : invisible pour les humains, rempli par les robots */}
        <div className="visually-hidden" aria-hidden="true">
          <label htmlFor="comment-website">{this.props.t('Ne pas remplir')}</label>
          <input
            id="comment-website"
            type="text"
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
            {this.props.t('Publié après modération.')}
          </span>
          <button
            type="submit"
            className="pf-btn pf-btn--pri"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? this.props.t('Envoi…') : this.props.t('Envoyer')}
          </button>
        </div>
      </form>
    );
  }
}

export default withLocale(CommentForm);
