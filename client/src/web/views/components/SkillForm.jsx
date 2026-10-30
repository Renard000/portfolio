import { Component } from 'react';

/** Formulaire compétence : nom, niveau (0-100, barre de la page À propos), ordre. */
export default class SkillForm extends Component {
  constructor(props) {
    super(props);
    const s = props.initial;
    this.state = {
      values: {
        name: s ? s.name : '',
        level: s ? String(s.level) : '80',
        icon: (s && s.icon) || '',
        sortOrder: s ? String(s.sortOrder ?? 0) : '0',
      },
    };
  }

  set = (key) => (e) => {
    const { value } = e.target;
    this.setState((st) => ({ values: { ...st.values, [key]: value } }));
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
        <div className="col-md-8">
          <label htmlFor="skill-name" className="form-label">
            Nom *
          </label>
          <input
            id="skill-name"
            className="form-control"
            value={v.name}
            onChange={this.set('name')}
            required
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="skill-level" className="form-label">
            Niveau (%) *
          </label>
          <input
            id="skill-level"
            type="number"
            min="0"
            max="100"
            className="form-control"
            value={v.level}
            onChange={this.set('level')}
            required
          />
        </div>
        <div className="col-12">
          <div className="pf-bar" aria-hidden="true">
            <i
              style={{ '--w': `${Math.min(100, Math.max(0, Number(v.level) || 0))}%` }}
            />
          </div>
        </div>
        <div className="col-md-8">
          <label htmlFor="skill-icon" className="form-label">
            Icône Font Awesome (facultatif, ex. fa-brands fa-react)
          </label>
          <input
            id="skill-icon"
            className="form-control"
            value={v.icon}
            onChange={this.set('icon')}
          />
        </div>
        <div className="col-md-4">
          <label htmlFor="skill-order" className="form-label">
            Ordre
          </label>
          <input
            id="skill-order"
            type="number"
            className="form-control"
            value={v.sortOrder}
            onChange={this.set('sortOrder')}
          />
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
