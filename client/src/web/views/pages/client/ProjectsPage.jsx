import { PureComponent } from 'react';
import PageHero from '../../components/PageHero.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';
import RevealOnScroll from '../../components/RevealOnScroll.jsx';

export default class ProjectsPage extends PureComponent {
  render() {
    const { projects, total, categories, filters, onFilter } = this.props;
    const [first, second, ...rest] = projects;
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(48px,8vw,90px)' }}>
        <PageHero kicker="Projets" title="Travaux" outline="sélectionnés." />
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
              Tous ({total})
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
            <label htmlFor="project-search" className="visually-hidden">
              Rechercher un projet
            </label>
            <input
              id="project-search"
              type="search"
              className="pf-input"
              style={{ minWidth: 280, borderRadius: 999 }}
              placeholder="Rechercher un projet…"
              value={filters.q}
              onChange={(e) => onFilter({ q: e.target.value })}
            />
          </div>
        </div>
        <div style={{ paddingTop: 48 }} role="status" aria-live="polite">
          {projects.length === 0 ? (
            <p className="pf-mu">Aucun projet ne correspond à cette recherche.</p>
          ) : null}
        </div>
        {first ? (
          <div
            className="pf-split"
            style={{
              display: 'grid',
              gridTemplateColumns: second ? '7fr 5fr' : '1fr',
              gap: 24,
            }}
          >
            <RevealOnScroll>
              <ProjectCard project={first} height={380} />
            </RevealOnScroll>
            {second ? (
              <RevealOnScroll>
                <ProjectCard project={second} height={380} />
              </RevealOnScroll>
            ) : null}
          </div>
        ) : null}
        {rest.length ? (
          <div className="pf-grid3" style={{ marginTop: 24 }}>
            {rest.map((p) => (
              <RevealOnScroll key={p.slug}>
                <ProjectCard project={p} height={240} />
              </RevealOnScroll>
            ))}
          </div>
        ) : null}
      </main>
    );
  }
}
ProjectsPage.defaultProps = {
  projects: [],
  categories: [],
  total: 0,
  filters: { category: 'all', q: '' },
};
