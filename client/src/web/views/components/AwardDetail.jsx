import { PureComponent } from 'react';
import Award from '../../../domain/models/Award.js';
import Certification from '../../../domain/models/Certification.js';
import { safeHref } from '../../utils/url.js';

export default class AwardDetail extends PureComponent {
  render() {
    const award = new Award(this.props.award);
    const doc = safeHref(award.documentUrl);
    return (
      <div>
        {award.imageUrl ? (
          <img
            src={award.imageUrl}
            className="img-fluid rounded mb-3"
            alt={award.title}
          />
        ) : null}
        {award.description ? <p>{award.description}</p> : null}
        <dl className="row small mb-2">
          <dt className="col-sm-4">Type</dt>
          <dd className="col-sm-8">{award.typeLabel()}</dd>
          <dt className="col-sm-4">Organisme</dt>
          <dd className="col-sm-8">{award.organization}</dd>
          <dt className="col-sm-4">Date</dt>
          <dd className="col-sm-8">{Certification.formatDate(award.awardedAt)}</dd>
          {award.hasAmount() ? (
            <>
              <dt className="col-sm-4">Montant</dt>
              <dd className="col-sm-8">{award.formattedAmount()}</dd>
            </>
          ) : null}
        </dl>
        {doc ? (
          <a
            className="btn btn-outline-primary btn-sm"
            href={doc}
            target="_blank"
            rel="noopener noreferrer"
          >
            Voir le justificatif
          </a>
        ) : null}
      </div>
    );
  }
}
