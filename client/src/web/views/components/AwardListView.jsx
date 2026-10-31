import { PureComponent } from 'react';
import { AWARD_TYPE_LABELS } from '../../../domain/models/Award.js';
import AwardDetail from './AwardDetail.jsx';
import AwardTimeline from './AwardTimeline.jsx';
import AwardTotals from './AwardTotals.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import Modal from './Modal.jsx';
import PageHero from './PageHero.jsx';
import withLocale from '../../context/withLocale.jsx';

const TABS = [['all', 'Toutes'], ...Object.entries(AWARD_TYPE_LABELS)];

class AwardListView extends PureComponent {
  render() {
    const {
      groups,
      totals,
      activeType,
      selected,
      onTypeChange,
      onSelect,
      onCloseDetail,
    } = this.props;
    return (
      <main
        className="pf-wrap"
        style={{ paddingTop: 'clamp(48px,8vw,90px)', paddingBottom: 48 }}
      >
        <PageHero
          kicker={this.props.t('Distinctions')}
          title={this.props.t('Bourses')}
          outline={this.props.t('et mérites.')}
        />
        <div style={{ height: 36 }} />
        <ErrorBoundary message={this.props.t('Les totaux ne peuvent pas être affichés.')}>
          <AwardTotals totals={totals} />
        </ErrorBoundary>
        <ul className="nav nav-tabs mb-3" role="tablist">
          {TABS.map(([type, label]) => (
            <li key={type} className="nav-item" role="presentation">
              <button
                type="button"
                role="tab"
                aria-selected={activeType === type}
                className={`nav-link ${activeType === type ? 'active' : ''}`}
                onClick={() => onTypeChange(type)}
              >
                {this.props.t(label)}
              </button>
            </li>
          ))}
        </ul>
        <ErrorBoundary
          message={this.props.t('La frise chronologique ne peut pas être affichée.')}
        >
          <AwardTimeline groups={groups} onSelect={onSelect} />
        </ErrorBoundary>
        {selected ? (
          <Modal title={selected.title} onClose={onCloseDetail}>
            <AwardDetail award={selected} />
          </Modal>
        ) : null}
      </main>
    );
  }
}

AwardListView.defaultProps = {
  groups: [],
  activeType: 'all',
  totals: { count: 0, scholarshipAmounts: {} },
};

export default withLocale(AwardListView);
