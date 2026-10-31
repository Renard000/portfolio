import { PureComponent } from 'react';
import AnimatedCounter from './AnimatedCounter.jsx';
import CertificationCard from './CertificationCard.jsx';
import CertificationCarousel from './CertificationCarousel.jsx';
import CertificationDetail from './CertificationDetail.jsx';
import CertificationFilters from './CertificationFilters.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import Modal from './Modal.jsx';
import PageHero from './PageHero.jsx';
import withLocale from '../../context/withLocale.jsx';

class CertificationListView extends PureComponent {
  render() {
    const { items, totalCount, filters, facets, view, selected } = this.props;
    const { onFilterChange, onReset, onViewChange, onSelect, onCloseDetail } = this.props;
    return (
      <main
        className="pf-wrap"
        style={{ paddingTop: 'clamp(48px,8vw,90px)', paddingBottom: 48 }}
      >
        <PageHero
          kicker={this.props.t('Certifications')}
          title={this.props.t('Validé')}
          outline={this.props.t('par les pairs.')}
        >
          <div className="pf-col" style={{ alignItems: 'flex-end', gap: 0 }}>
            <span
              className="pf-h1 pf-lime"
              style={{ fontSize: 'clamp(4rem,9vw,8rem)' }}
              data-testid="cert-total"
            >
              <AnimatedCounter value={totalCount} />
            </span>
            <span className="pf-mono">{this.props.t('Certifications')}</span>
          </div>
        </PageHero>
        <div style={{ height: 36 }} />
        <CertificationFilters
          filters={filters}
          facets={facets}
          view={view}
          onChange={onFilterChange}
          onReset={onReset}
          onViewChange={onViewChange}
        />
        <p className="text-muted small" role="status">
          {items.length} {this.props.t('résultat')}
          {items.length > 1 ? 's' : ''}
        </p>
        <ErrorBoundary
          message={this.props.t('La liste des certifications ne peut pas être affichée.')}
        >
          {view === 'carousel' ? (
            <CertificationCarousel items={items} onOpen={onSelect} />
          ) : items.length ? (
            <div className="row g-3">
              {items.map((c) => (
                <div key={c.id} className="col-12 col-sm-6 col-lg-4">
                  <CertificationCard certification={c} onOpen={onSelect} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">
              {this.props.t('Aucune certification ne correspond à ces filtres.')}
            </p>
          )}
        </ErrorBoundary>
        {selected ? (
          <Modal title={selected.title} onClose={onCloseDetail}>
            <CertificationDetail certification={selected} />
          </Modal>
        ) : null}
      </main>
    );
  }
}

CertificationListView.defaultProps = { items: [], totalCount: 0, view: 'grid' };

export default withLocale(CertificationListView);
