import { PureComponent } from 'react';
import Award from '../../../domain/models/Award.js';
import AnimatedCounter from './AnimatedCounter.jsx';

export default class AwardTotals extends PureComponent {
  render() {
    const { totals } = this.props;
    const amounts = Object.entries(totals.scholarshipAmounts || {});
    return (
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <div className="display-6" data-testid="award-count">
                <AnimatedCounter value={totals.count} />
              </div>
              <div className="small text-muted">Distinctions</div>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-9">
          <div className="card h-100">
            <div className="card-body">
              <div className="small text-muted">Bourses cumulées</div>
              {amounts.length ? (
                <ul className="list-inline mb-0" data-testid="award-amounts">
                  {amounts.map(([cur, amount]) => (
                    <li key={cur} className="list-inline-item h5 mb-0">
                      {Award.formatMoney(amount, cur)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-0 text-muted">Aucun montant</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

AwardTotals.defaultProps = { totals: { count: 0, scholarshipAmounts: {} } };
