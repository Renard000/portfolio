import { PureComponent } from 'react';
import Video from '../../../../domain/models/Video.js';
import PageHero from '../../components/PageHero.jsx';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';
import SeriesCard from '../../components/SeriesCard.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

export default class FormationsPage extends PureComponent {
  render() {
    const { items, total, categories, filters, loading, error, onFilter } = this.props;
    const chip = (label, on, onClick) => (
      <button
        key={label}
        type="button"
        className={`pf-chip ${on ? 'is-on' : ''}`}
        aria-pressed={on}
        onClick={onClick}
      >
        {label}
      </button>
    );
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(48px,8vw,90px)' }}>
        <PageHero kicker="Formations" title="Apprendre" outline="en vidéo." />
        <div className="pf-row pf-between" style={{ marginTop: 36, gap: 20 }}>
          <div className="pf-row" style={{ gap: 10 }}>
            <div
              className="pf-row"
              style={{ gap: 10 }}
              role="group"
              aria-label="Catégories"
            >
              {chip('Toutes', filters.category === 'all', () =>
                onFilter({ category: 'all' })
              )}
              {categories.map((c) =>
                chip(c, filters.category === c, () => onFilter({ category: c }))
              )}
            </div>
            <div className="pf-row" style={{ gap: 10 }} role="group" aria-label="Niveau">
              {LEVELS.map((l) =>
                chip(Video.levelLabel(l), filters.level === l, () =>
                  onFilter({ level: filters.level === l ? 'all' : l })
                )
              )}
            </div>
          </div>
          <div>
            <label htmlFor="series-search" className="visually-hidden">
              Rechercher une série
            </label>
            <input
              id="series-search"
              type="search"
              className="pf-input"
              style={{ minWidth: 260, borderRadius: 999 }}
              placeholder="Rechercher une série…"
              value={filters.q}
              onChange={(e) => onFilter({ q: e.target.value })}
            />
          </div>
        </div>
        <div style={{ paddingTop: 40 }} role="status" aria-live="polite">
          {error ? <p className="pf-error">{error}</p> : null}
          {loading && !items.length ? <p className="pf-mu">Chargement…</p> : null}
          {!loading && !error && !items.length ? (
            <p className="pf-mu">Aucune série ne correspond à ces critères.</p>
          ) : null}
        </div>
        <div className="pf-grid3">
          {items.map((s) => (
            <RevealOnScroll key={s.slug}>
              <SeriesCard series={s} />
            </RevealOnScroll>
          ))}
        </div>
        {total > items.length ? (
          <p className="pf-mu" style={{ marginTop: 24 }}>
            {items.length} séries affichées sur {total}.
          </p>
        ) : null}
      </main>
    );
  }
}
FormationsPage.defaultProps = {
  items: [],
  categories: [],
  total: 0,
  filters: { category: 'all', level: 'all', q: '' },
};
