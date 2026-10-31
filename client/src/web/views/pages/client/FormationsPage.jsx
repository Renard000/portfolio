import { PureComponent } from 'react';
import Video from '../../../../domain/models/Video.js';
import PageHero from '../../components/PageHero.jsx';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';
import SeriesCard from '../../components/SeriesCard.jsx';
import withLocale from '../../../context/withLocale.jsx';

const LEVELS = ['beginner', 'intermediate', 'advanced'];

class FormationsPage extends PureComponent {
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
        <PageHero
          kicker={this.props.t('Formations')}
          title={this.props.t('Apprendre')}
          outline={this.props.t('en vidéo.')}
        />
        <div className="pf-row pf-between" style={{ marginTop: 36, gap: 20 }}>
          <div className="pf-row" style={{ gap: 10 }}>
            <div
              className="pf-row"
              style={{ gap: 10 }}
              role="group"
              aria-label={this.props.t('Catégories')}
            >
              {chip(this.props.t('Toutes'), filters.category === 'all', () =>
                onFilter({ category: 'all' })
              )}
              {categories.map((c) =>
                chip(c, filters.category === c, () => onFilter({ category: c }))
              )}
            </div>
            <div
              className="pf-row"
              style={{ gap: 10 }}
              role="group"
              aria-label={this.props.t('Niveau')}
            >
              {LEVELS.map((l) =>
                chip(this.props.t(Video.levelLabel(l)), filters.level === l, () =>
                  onFilter({ level: filters.level === l ? 'all' : l })
                )
              )}
            </div>
          </div>
          <div>
            <label htmlFor="series-search" className="visually-hidden">
              {this.props.t('Rechercher une série')}
            </label>
            <input
              id="series-search"
              type="search"
              className="pf-input"
              style={{ minWidth: 260, borderRadius: 999 }}
              placeholder={this.props.t('Rechercher une série…')}
              value={filters.q}
              onChange={(e) => onFilter({ q: e.target.value })}
            />
          </div>
        </div>
        <div style={{ paddingTop: 40 }} role="status" aria-live="polite">
          {error ? <p className="pf-error">{error}</p> : null}
          {loading && !items.length ? (
            <p className="pf-mu">{this.props.t('Chargement…')}</p>
          ) : null}
          {!loading && !error && !items.length ? (
            <p className="pf-mu">
              {this.props.t('Aucune série ne correspond à ces critères.')}
            </p>
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
            {items.length} {this.props.t('séries affichées sur')} {total}.
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

export default withLocale(FormationsPage);
