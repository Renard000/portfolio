import { PureComponent } from 'react';
import { AWARD_TYPE_LABELS } from '../../../domain/models/Award.js';
import AwardDetail from './AwardDetail.jsx';
import AwardTimeline from './AwardTimeline.jsx';
import AwardTotals from './AwardTotals.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import Modal from './Modal.jsx';

const TABS = [['all', 'Toutes'], ...Object.entries(AWARD_TYPE_LABELS)];

export default class AwardListView extends PureComponent {
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
      <main className="container py-4">
        <h1 className="h2">Bourses et mérites</h1>
        <ErrorBoundary message="Les totaux ne peuvent pas être affichés.">
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
                {label}
              </button>
            </li>
          ))}
        </ul>
        <ErrorBoundary message="La frise chronologique ne peut pas être affichée.">
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
