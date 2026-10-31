import { PureComponent } from 'react';
import Award from '../../../domain/models/Award.js';
import Certification from '../../../domain/models/Certification.js';
import { safeHref } from '../../utils/url.js';
import withLocale from '../../context/withLocale.jsx';

class AwardDetail extends PureComponent {
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
          <dt className="col-sm-4">{this.props.t('Type')}</dt>
          <dd className="col-sm-8">{this.props.t(award.typeLabel())}</dd>
          <dt className="col-sm-4">{this.props.t('Organisme')}</dt>
          <dd className="col-sm-8">{award.organization}</dd>
          <dt className="col-sm-4">{this.props.t('Date')}</dt>
          <dd className="col-sm-8">
            {Certification.formatDate(award.awardedAt, this.props.locale)}
          </dd>
          {award.hasAmount() ? (
            <>
              <dt className="col-sm-4">{this.props.t('Montant')}</dt>
              <dd className="col-sm-8">{award.formattedAmount(this.props.locale)}</dd>
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
            {this.props.t('Voir le justificatif')}
          </a>
        ) : null}
      </div>
    );
  }
}

export default withLocale(AwardDetail);
