import { PureComponent } from 'react';
import Award from '../../../domain/models/Award.js';
import Certification from '../../../domain/models/Certification.js';
import RevealOnScroll from './RevealOnScroll.jsx';

const TYPE_STYLE = {
  scholarship: 'bg-success',
  merit: 'bg-info text-dark',
  award: 'bg-warning text-dark',
  honor: 'bg-secondary',
};

export default class TimelineItem extends PureComponent {
  open = () => this.props.onOpen(this.props.award);

  render() {
    const award = new Award(this.props.award);
    return (
      <li className="timeline-item">
        <RevealOnScroll>
          <article className="card award-card">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start gap-2">
                <h4 className="h6 mb-1">{award.title}</h4>
                <span className={`badge ${TYPE_STYLE[award.type] || 'bg-secondary'}`}>
                  {award.typeLabel()}
                </span>
              </div>
              <p className="text-muted small mb-1">{award.organization}</p>
              <p className="small mb-2">{Certification.formatDate(award.awardedAt)}</p>
              {award.hasAmount() ? (
                <p className="fw-semibold mb-2">{award.formattedAmount()}</p>
              ) : null}
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={this.open}
              >
                Voir le détail
              </button>
            </div>
          </article>
        </RevealOnScroll>
      </li>
    );
  }
}
