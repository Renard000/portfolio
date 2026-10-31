import { PureComponent } from 'react';
import Award from '../../../domain/models/Award.js';
import Certification from '../../../domain/models/Certification.js';
import NewItemsContext from '../../context/NewItemsContext.js';
import NewBadge from './NewBadge.jsx';
import RevealOnScroll from './RevealOnScroll.jsx';
import withLocale from '../../context/withLocale.jsx';

const TYPE_STYLE = {
  scholarship: 'bg-success',
  merit: 'bg-info text-dark',
  award: 'bg-warning text-dark',
  honor: 'bg-secondary',
};

class TimelineItem extends PureComponent {
  static contextType = NewItemsContext;

  open = () => {
    this.context.markSeen(`award:${this.props.award.id}`);
    this.props.onOpen(this.props.award);
  };

  render() {
    const award = new Award(this.props.award);
    return (
      <li className="timeline-item">
        <RevealOnScroll>
          <article className="card award-card">
            <NewBadge itemKey={`award:${award.id}`} />
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <h4 className="h6 mb-1">{award.title}</h4>
                <span className={`badge ${TYPE_STYLE[award.type] || 'bg-secondary'}`}>
                  {this.props.t(award.typeLabel())}
                </span>
              </div>
              <p className="text-muted small mb-1">{award.organization}</p>
              <p className="small mb-2">
                {Certification.formatDate(award.awardedAt, this.props.locale)}
              </p>
              {award.hasAmount() ? (
                <p className="fw-semibold mb-2">
                  {award.formattedAmount(this.props.locale)}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={this.open}
              >
                {this.props.t('Voir le détail')}
              </button>
            </div>
          </article>
        </RevealOnScroll>
      </li>
    );
  }
}

export default withLocale(TimelineItem);
