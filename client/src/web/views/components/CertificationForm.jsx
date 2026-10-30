import { Component } from 'react';
import NotifyCheckbox from './NotifyCheckbox.jsx';

const EMPTY = {
  title: '',
  issuer: '',
  category: '',
  description: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  credentialUrl: '',
  skills: '',
  featured: false,
  notify: true,
  sortOrder: '0',
  imageUrl: '',
  documentUrl: '',
};

/** Formulaire (création / édition) : image et PDF envoyés par le contrôleur au submit. */
export default class CertificationForm extends Component {
  constructor(props) {
    super(props);
    const c = props.initial;
    this.state = {
      values: c
        ? {
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(c).filter(([, v]) => v !== null && v !== undefined)
            ),
            skills: (c.skills || []).join(', '),
            sortOrder: String(c.sortOrder ?? 0),
          }
        : { ...EMPTY },
      imageFile: null,
      documentFile: null,
    };
  }

  set = (key) => (e) => {
    // Lire l'événement tout de suite : le callback de setState s'exécute plus tard.
    const { type, checked, value } = e.target;
    const next = type === 'checkbox' ? checked : value;
    this.setState((s) => ({ values: { ...s.values, [key]: next } }));
  };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.values, {
      imageFile: this.state.imageFile,
      documentFile: this.state.documentFile,
    });
  };

  field(id, label, props = {}) {
    return (
      <div className="col-md-6">
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        <input
          id={id}
          className="form-control"
          value={this.state.values[props.key || id]}
          onChange={this.set(props.key || id)}
          {...props.input}
        />
      </div>
    );
  }

  render() {
    const { saving, error, onCancel } = this.props;
    const v = this.state.values;
    return (
      <form onSubmit={this.submit} className="row g-3" noValidate>
        {this.field('title', 'Titre *', { input: { required: true } })}
        {this.field('issuer', 'Émetteur *', { input: { required: true } })}
        {this.field('category', 'Catégorie')}
        {this.field('credentialId', "Identifiant de l'attestation")}
        {this.field('issueDate', "Date d'obtention *", {
          input: { type: 'date', required: true },
        })}
        {this.field('expiryDate', "Date d'expiration", { input: { type: 'date' } })}
        {this.field('credentialUrl', 'Lien de vérification', { input: { type: 'url' } })}
        {this.field('skills', 'Compétences (séparées par des virgules)')}
        <div className="col-12">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            className="form-control"
            rows="3"
            value={v.description}
            onChange={this.set('description')}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="imageFile" className="form-label">
            Image du badge (PNG, JPEG, WebP)
          </label>
          <input
            id="imageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="form-control"
            onChange={(e) => this.setState({ imageFile: e.target.files[0] || null })}
          />
          {v.imageUrl && !this.state.imageFile ? (
            <small className="text-muted">Image actuelle conservée.</small>
          ) : null}
        </div>
        <div className="col-md-6">
          <label htmlFor="documentFile" className="form-label">
            Document (PDF)
          </label>
          <input
            id="documentFile"
            type="file"
            accept="application/pdf"
            className="form-control"
            onChange={(e) => this.setState({ documentFile: e.target.files[0] || null })}
          />
          {v.documentUrl && !this.state.documentFile ? (
            <small className="text-muted">Document actuel conservé.</small>
          ) : null}
        </div>
        <div className="col-md-3">
          <label htmlFor="sortOrder" className="form-label">
            Ordre d'affichage
          </label>
          <input
            id="sortOrder"
            type="number"
            className="form-control"
            value={v.sortOrder}
            onChange={this.set('sortOrder')}
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <div className="form-check">
            <input
              id="featured"
              type="checkbox"
              className="form-check-input"
              checked={v.featured}
              onChange={this.set('featured')}
            />
            <label htmlFor="featured" className="form-check-label">
              En vedette
            </label>
          </div>
        </div>
        {this.props.initial ? null : (
          <NotifyCheckbox id="notify" checked={v.notify} onChange={this.set('notify')} />
        )}
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
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    );
  }
}
