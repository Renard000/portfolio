import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../../components/PageHero.jsx';
import ArticleCard from '../../components/ArticleCard.jsx';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';
import Thumb from '../../components/Thumb.jsx';

/** Liste du blog (maquette P-04) : filtres, article à la une, grille, pagination. */
export default class BlogPage extends PureComponent {
  renderFeatured(card) {
    return (
      <div
        className="pf-card pf-split"
        style={{
          display: 'grid',
          gridTemplateColumns: '6fr 6fr',
          gap: 40,
          padding: 20,
          alignItems: 'center',
        }}
      >
        <Thumb color={card.color} kind={0} height={380} imageUrl={card.coverUrl} />
        <div className="pf-col" style={{ gap: 18, paddingRight: 24 }}>
          <span className="pf-chip is-on" style={{ alignSelf: 'flex-start' }}>
            À la une
          </span>
          <h2 className="pf-h2" style={{ fontSize: 'clamp(2rem,3.4vw,2.9rem)' }}>
            {card.title}
          </h2>
          {card.excerpt ? (
            <p className="pf-mu" style={{ margin: 0 }}>
              {card.excerpt}
            </p>
          ) : null}
          <div className="pf-row pf-mono" style={{ gap: 18 }}>
            <span>{card.fullDate}</span>
            <span>{card.minutes} min</span>
            <span>♥ {card.likes}</span>
          </div>
          <Link
            className="pf-btn pf-btn--pri"
            to={`/blog/${card.slug}`}
            style={{ alignSelf: 'flex-start' }}
          >
            Lire l’article →
          </Link>
        </div>
      </div>
    );
  }

  renderPagination() {
    const { page, pages, onPage } = this.props;
    if (pages <= 1) return null;
    const numbers = Array.from({ length: pages }, (_, i) => i + 1);
    return (
      <nav
        className="pf-row pf-pages"
        style={{ marginTop: 56, gap: 10 }}
        aria-label="Pagination"
      >
        <button
          type="button"
          className="pf-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Page précédente"
        >
          ‹
        </button>
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            className={`pf-btn${n === page ? ' pf-btn--pri' : ''}`}
            aria-current={n === page ? 'page' : undefined}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="pf-btn"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Page suivante"
        >
          ›
        </button>
      </nav>
    );
  }

  render() {
    const { cards, featured, categories, filters, loading, error, onFilter, onRetry } =
      this.props;
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(48px,8vw,90px)' }}>
        <PageHero kicker="Blog" title="Notes de" outline="terrain." />
        <div className="pf-row pf-between" style={{ margin: '36px 0 0' }}>
          <div
            className="pf-row"
            style={{ gap: 10 }}
            role="group"
            aria-label="Catégories"
          >
            <button
              type="button"
              className={`pf-chip ${filters.category === 'all' ? 'is-on' : ''}`}
              aria-pressed={filters.category === 'all'}
              onClick={() => onFilter({ category: 'all' })}
            >
              Tout
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                className={`pf-chip ${filters.category === c ? 'is-on' : ''}`}
                aria-pressed={filters.category === c}
                onClick={() => onFilter({ category: c })}
              >
                {c}
              </button>
            ))}
          </div>
          <div>
            <label htmlFor="article-search" className="visually-hidden">
              Rechercher un article
            </label>
            <input
              id="article-search"
              type="search"
              className="pf-input"
              style={{ minWidth: 280, borderRadius: 999 }}
              placeholder="Rechercher un article…"
              value={filters.q}
              onChange={(e) => onFilter({ q: e.target.value })}
            />
          </div>
        </div>

        <div style={{ paddingTop: 48 }} role="status" aria-live="polite">
          {loading && !cards.length && !featured ? (
            <p className="pf-mu">Chargement…</p>
          ) : null}
          {!loading && !error && !cards.length && !featured ? (
            <p className="pf-mu">Aucun article ne correspond à cette recherche.</p>
          ) : null}
        </div>
        {error ? (
          <div
            className="pf-card pf-col"
            role="alert"
            style={{ alignItems: 'flex-start' }}
          >
            <span className="pf-mono pf-lime">Erreur</span>
            <p className="pf-mu" style={{ margin: 0 }}>
              Section indisponible. {error}
            </p>
            <button type="button" className="pf-btn" onClick={onRetry}>
              Réessayer
            </button>
          </div>
        ) : null}

        {featured ? this.renderFeatured(featured) : null}
        {cards.length ? (
          <div className="pf-grid3" style={{ marginTop: 24 }}>
            {cards.map((c) => (
              <RevealOnScroll key={c.id}>
                <ArticleCard card={c} />
              </RevealOnScroll>
            ))}
          </div>
        ) : null}
        {this.renderPagination()}
      </main>
    );
  }
}
BlogPage.defaultProps = { cards: [], categories: [] };
