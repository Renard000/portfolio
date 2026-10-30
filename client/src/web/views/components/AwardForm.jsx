import { Component } from 'react';
import NotifyCheckbox from './NotifyCheckbox.jsx';
import { AWARD_TYPE_LABELS } from '../../../domain/models/Award.js';

const EMPTY = {
  title: '',
  type: 'award',
  organization: '',
  description: '',
  amount: '',
  currency: 'CAD',
  awardedAt: '',
  featured: false,
  notify: true,
  sortOrder: '0',
  imageUrl: '',
  documentUrl: '',
};

export default class AwardForm extends Component {
  constructor(props) {
    super(props);
    const a = props.initial;
    this.state = {
      values: a
        ? {
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(a).filter(([, v]) => v !== null && v !== undefined)
            ),
            amount: a.amount === null || a.amount === undefined ? '' : String(a.amount),
            sortOrder: String(a.sortOrder ?? 0),
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

  render() {
    const { saving, error, onCancel } = this.props;
    const v = this.state.values;
    return (
      <form onSubmit={this.submit} className="row g-3" noValidate>
        <div className="col-md-6">
          <label htmlFor="a-title" className="form-label">
            Titre *
          </label>
          <input
            id="a-title"
            className="form-control"
            value={v.title}
            onChange={this.set('title')}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="a-org" className="form-label">
            Organisme *
          </label>
          <input
            id="a-org"
            className="form-control"
            value={v.organization}
            onChange={this.set('organization')}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="a-type" className="form-label">
            Type
          </label>
          <select
            id="a-type"
            className="form-select"
            value={v.type}
            onChange={this.set('type')}
          >
            {Object.entries(AWARD_TYPE_LABELS).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label htmlFor="a-date" className="form-label">
            Date *
          </label>
          <input
            id="a-date"
            type="date"
            className="form-control"
            value={v.awardedAt}
            onChange={this.set('awardedAt')}
            required
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="a-amount" className="form-label">
            Montant
          </label>
          <input
            id="a-amount"
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            value={v.amount}
            onChange={this.set('amount')}
          />
        </div>
        <div className="col-md-2">
          <label htmlFor="a-currency" className="form-label">
            Devise
          </label>
          <input
            id="a-currency"
            maxLength="3"
            className="form-control"
            value={v.currency}
            onChange={this.set('currency')}
          />
        </div>
        <div className="col-12">
          <label htmlFor="a-desc" className="form-label">
            Description
          </label>
          <textarea
            id="a-desc"
            rows="3"
            className="form-control"
            value={v.description}
            onChange={this.set('description')}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="a-image" className="form-label">
            Image
          </label>
          <input
            id="a-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="form-control"
            onChange={(e) => this.setState({ imageFile: e.target.files[0] || null })}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="a-doc" className="form-label">
            Justificatif (PDF)
          </label>
          <input
            id="a-doc"
            type="file"
            accept="application/pdf"
            className="form-control"
            onChange={(e) => this.setState({ documentFile: e.target.files[0] || null })}
          />
          <small className="text-muted">
            Attention : le bucket est public. Masquez les données personnelles avant
            l'envoi.
          </small>
        </div>
        <div className="col-md-3">
          <label htmlFor="a-order" className="form-label">
            Ordre d'affichage
          </label>
          <input
            id="a-order"
            type="number"
            className="form-control"
            value={v.sortOrder}
            onChange={this.set('sortOrder')}
          />
        </div>
        <div className="col-md-4 d-flex align-items-end">
          <div className="form-check">
            <input
              id="a-featured"
              type="checkbox"
              className="form-check-input"
              checked={v.featured}
              onChange={this.set('featured')}
            />
            <label htmlFor="a-featured" className="form-check-label">
              En vedette
            </label>
          </div>
        </div>
        {this.props.initial ? null : (
          <NotifyCheckbox
            id="a-notify"
            checked={v.notify}
            onChange={this.set('notify')}
          />
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
