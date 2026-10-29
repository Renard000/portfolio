import { Component } from 'react';
import Video from '../../../domain/models/Video.js';

const EMPTY = {
  title: '',
  slug: '',
  description: '',
  category: '',
  level: 'beginner',
  tags: '',
  language: 'fr',
  status: 'draft',
  featured: false,
  sortOrder: '0',
};

const slugify = (t) =>
  String(t)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default class SeriesForm extends Component {
  constructor(props) {
    super(props);
    const s = props.initial;
    this.state = {
      slugTouched: Boolean(s),
      values: s
        ? {
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(s).filter(([, v]) => v !== null && v !== undefined)
            ),
            tags: (s.tags || []).join(', '),
            sortOrder: String(s.sortOrder ?? 0),
          }
        : { ...EMPTY },
    };
  }

  set = (key) => (e) => {
    const { type, checked, value } = e.target;
    const next = type === 'checkbox' ? checked : value;
    this.setState((st) => {
      const values = { ...st.values, [key]: next };
      if (key === 'title' && !st.slugTouched) values.slug = slugify(next); // slug proposé tant qu'on n'y touche pas
      return { values, slugTouched: st.slugTouched || key === 'slug' };
    });
  };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.values);
  };

  render() {
    const { saving, error, onCancel } = this.props;
    const v = this.state.values;
    return (
      <form onSubmit={this.submit} className="row g-3" noValidate>
        <div className="col-md-6">
          <label htmlFor="s-title" className="form-label">
            Titre *
          </label>
          <input
            id="s-title"
            className="form-control"
            value={v.title}
            onChange={this.set('title')}
            required
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="s-slug" className="form-label">
            Slug *
          </label>
          <input
            id="s-slug"
            className="form-control"
            value={v.slug}
            onChange={this.set('slug')}
            required
          />
        </div>
        <div className="col-12">
          <label htmlFor="s-desc" className="form-label">
            Description
          </label>
          <textarea
            id="s-desc"
            rows="3"
            className="form-control"
            value={v.description}
            onChange={this.set('description')}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="s-cat" className="form-label">
            Catégorie
          </label>
          <input
            id="s-cat"
            className="form-control"
            value={v.category}
            onChange={this.set('category')}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="s-level" className="form-label">
            Niveau
          </label>
          <select
            id="s-level"
            className="form-select"
            value={v.level}
            onChange={this.set('level')}
          >
            {['beginner', 'intermediate', 'advanced'].map((l) => (
              <option key={l} value={l}>
                {Video.levelLabel(l)}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label htmlFor="s-lang" className="form-label">
            Langue
          </label>
          <input
            id="s-lang"
            maxLength="2"
            className="form-control"
            value={v.language}
            onChange={this.set('language')}
          />
        </div>
        <div className="col-md-6">
          <label htmlFor="s-tags" className="form-label">
            Étiquettes (séparées par des virgules)
          </label>
          <input
            id="s-tags"
            className="form-control"
            value={v.tags}
            onChange={this.set('tags')}
          />
        </div>
        <div className="col-md-3">
          <label htmlFor="s-status" className="form-label">
            Statut
          </label>
          <select
            id="s-status"
            className="form-select"
            value={v.status}
            onChange={this.set('status')}
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
          </select>
        </div>
        <div className="col-md-3">
          <label htmlFor="s-order" className="form-label">
            Ordre
          </label>
          <input
            id="s-order"
            type="number"
            className="form-control"
            value={v.sortOrder}
            onChange={this.set('sortOrder')}
          />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input
              id="s-featured"
              type="checkbox"
              className="form-check-input"
              checked={v.featured}
              onChange={this.set('featured')}
            />
            <label htmlFor="s-featured" className="form-check-label">
              En vedette
            </label>
          </div>
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
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>
    );
  }
}
