import { PureComponent } from 'react';

export default class CertificationFilters extends PureComponent {
  change = (key) => (e) => this.props.onChange({ [key]: e.target.value });

  render() {
    const { filters, facets, view, onViewChange, onReset } = this.props;
    return (
      <form
        className="row g-2 align-items-end mb-3"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <div className="col-12 col-md-4">
          <label htmlFor="cert-q" className="form-label small mb-0">
            Recherche
          </label>
          <input
            id="cert-q"
            type="search"
            className="form-control"
            placeholder="Titre, émetteur, compétence…"
            value={filters.q}
            onChange={this.change('q')}
          />
        </div>
        <div className="col-6 col-md-2">
          <label htmlFor="cert-issuer" className="form-label small mb-0">
            Émetteur
          </label>
          <select
            id="cert-issuer"
            className="form-select"
            value={filters.issuer}
            onChange={this.change('issuer')}
          >
            <option value="">Tous</option>
            {facets.issuers.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label htmlFor="cert-category" className="form-label small mb-0">
            Catégorie
          </label>
          <select
            id="cert-category"
            className="form-select"
            value={filters.category}
            onChange={this.change('category')}
          >
            <option value="">Toutes</option>
            {facets.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-2">
          <label htmlFor="cert-sort" className="form-label small mb-0">
            Tri
          </label>
          <select
            id="cert-sort"
            className="form-select"
            value={filters.sort}
            onChange={this.change('sort')}
          >
            <option value="date_desc">Plus récentes</option>
            <option value="date_asc">Plus anciennes</option>
          </select>
        </div>
        <div className="col-6 col-md-2 d-flex gap-1 justify-content-end">
          <div className="btn-group" role="group" aria-label="Mode d'affichage">
            <button
              type="button"
              className={`btn btn-outline-secondary ${view === 'grid' ? 'active' : ''}`}
              aria-pressed={view === 'grid'}
              onClick={() => onViewChange('grid')}
            >
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" /> Grille
            </button>
            <button
              type="button"
              className={`btn btn-outline-secondary ${view === 'carousel' ? 'active' : ''}`}
              aria-pressed={view === 'carousel'}
              onClick={() => onViewChange('carousel')}
            >
              <i className="fa-solid fa-images" aria-hidden="true" /> Carrousel
            </button>
          </div>
        </div>
        <div className="col-12">
          <button type="button" className="btn btn-link btn-sm p-0" onClick={onReset}>
            Réinitialiser les filtres
          </button>
        </div>
      </form>
    );
  }
}
