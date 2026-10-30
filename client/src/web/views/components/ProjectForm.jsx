import { Component } from 'react';
import NotifyCheckbox from './NotifyCheckbox.jsx';

const EMPTY = {
  title: '',
  slug: '',
  category: '',
  year: '',
  role: '',
  duration: '',
  summary: '',
  challenge: '',
  solution: '',
  tech: '',
  results: '',
  githubUrl: '',
  liveUrl: '',
  imageUrl: '',
  color: '',
  featured: false,
  notify: true,
  sortOrder: '0',
};

/** Formulaire projet (page détail P-12) : l'image est envoyée par le contrôleur au submit. */
export default class ProjectForm extends Component {
  constructor(props) {
    super(props);
    const p = props.initial;
    this.state = {
      values: p
        ? {
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(p).filter(([, v]) => v !== null && v !== undefined)
            ),
            tech: (p.tech || []).join(', '),
            results: (p.results || []).join('\n'),
            sortOrder: String(p.sortOrder ?? 0),
          }
        : { ...EMPTY },
      imageFile: null,
    };
  }

  set = (key) => (e) => {
    const { type, checked, value } = e.target;
    const next = type === 'checkbox' ? checked : value;
    this.setState((s) => ({ values: { ...s.values, [key]: next } }));
  };

  submit = (e) => {
    e.preventDefault();
    this.props.onSubmit(this.state.values, { imageFile: this.state.imageFile });
  };

  field(id, label, input = {}, col = 'col-md-6') {
    return (
      <div className={col}>
        <label htmlFor={`project-${id}`} className="form-label">
          {label}
        </label>
        <input
          id={`project-${id}`}
          className="form-control"
          value={this.state.values[id]}
          onChange={this.set(id)}
          {...input}
        />
      </div>
    );
  }

  area(id, label, rows = 3, hint) {
    return (
      <div className="col-12">
        <label htmlFor={`project-${id}`} className="form-label">
          {label}
        </label>
        <textarea
          id={`project-${id}`}
          className="form-control"
          rows={rows}
          value={this.state.values[id]}
          onChange={this.set(id)}
        />
        {hint ? <small className="text-muted">{hint}</small> : null}
      </div>
    );
  }

  render() {
    const { saving, error, onCancel } = this.props;
    const v = this.state.values;
    return (
      <form onSubmit={this.submit} className="row g-3" noValidate>
        {this.field('title', 'Titre *', { required: true })}
        {this.field('slug', 'Slug * (adresse /projets/…)', {
          required: true,
          pattern: '[a-z0-9]+(-[a-z0-9]+)*',
        })}
        {this.field('category', 'Catégorie (Web, Mobile, IA…)', {}, 'col-md-4')}
        {this.field('year', 'Année', {}, 'col-md-4')}
        {this.field('duration', 'Durée', {}, 'col-md-4')}
        {this.field('role', 'Rôle')}
        {this.field('tech', 'Technologies (séparées par des virgules)')}
        {this.area('summary', 'Résumé (carte de la liste)', 2)}
        {this.area('challenge', 'Le défi')}
        {this.area('solution', 'La solution')}
        {this.area('results', 'Indicateurs', 3, 'Un indicateur par ligne.')}
        {this.field('liveUrl', 'Lien du site', { type: 'url' })}
        {this.field('githubUrl', 'Code source', { type: 'url' })}
        <div className="col-md-6">
          <label htmlFor="project-image" className="form-label">
            Image (PNG, JPEG, WebP)
          </label>
          <input
            id="project-image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="form-control"
            onChange={(e) => this.setState({ imageFile: e.target.files[0] || null })}
          />
          {v.imageUrl && !this.state.imageFile ? (
            <small className="text-muted">Image actuelle conservée.</small>
          ) : null}
        </div>
        {this.field(
          'color',
          'Couleur de la vignette (#RRGGBB)',
          { placeholder: '#3b2f8f' },
          'col-md-3'
        )}
        {this.field('sortOrder', 'Ordre', { type: 'number' }, 'col-md-3')}
        <div className="col-12">
          <div className="form-check">
            <input
              id="project-featured"
              type="checkbox"
              className="form-check-input"
              checked={v.featured}
              onChange={this.set('featured')}
            />
            <label htmlFor="project-featured" className="form-check-label">
              En vedette sur l’accueil
            </label>
          </div>
        </div>
        {this.props.initial ? null : (
          <NotifyCheckbox
            id="project-notify"
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
