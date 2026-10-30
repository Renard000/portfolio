import { PureComponent } from 'react';
import Certification from '../../../domain/models/Certification.js';
import NewItemsContext from '../../context/NewItemsContext.js';
import NewBadge from './NewBadge.jsx';
import StatusBadge from './StatusBadge.jsx';

export default class CertificationCard extends PureComponent {
  static contextType = NewItemsContext;

  open = () => {
    this.context.markSeen(`certification:${this.props.certification.id}`);
    this.props.onOpen(this.props.certification);
  };

  render() {
    const cert = new Certification(this.props.certification);
    return (
      <article className="card h-100 certification-card">
        <NewBadge itemKey={`certification:${cert.id}`} />
        {cert.imageUrl ? (
          <img
            src={cert.imageUrl}
            className="card-img-top certification-card__img"
            alt={`Badge ${cert.title}`}
            loading="lazy"
          />
        ) : null}
        <div className="card-body d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <h3 className="h6 card-title mb-1">{cert.title}</h3>
            <StatusBadge status={cert.status()} />
          </div>
          <p className="text-muted small mb-1">{cert.issuer}</p>
          <p className="small mb-2">
            <i className="fa-regular fa-calendar me-1" aria-hidden="true" />
            {cert.formattedIssueDate()}
          </p>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm mt-auto"
            onClick={this.open}
          >
            Voir le détail
          </button>
        </div>
      </article>
    );
  }
}
