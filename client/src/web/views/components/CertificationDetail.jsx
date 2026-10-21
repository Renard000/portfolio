import { PureComponent } from 'react';
import Certification from '../../../domain/models/Certification.js';
import { safeHref } from '../../utils/url.js';
import StatusBadge from './StatusBadge.jsx';

export default class CertificationDetail extends PureComponent {
  render() {
    const cert = new Certification(this.props.certification);
    const verify = safeHref(cert.credentialUrl);
    const doc = safeHref(cert.documentUrl);
    return (
      <div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <p className="text-muted mb-0">{cert.issuer}</p>
          <StatusBadge status={cert.status()} />
        </div>
        {doc && cert.isPdfDocument() ? (
          <iframe
            className="w-100 border rounded mb-3"
            style={{ height: '360px' }}
            src={doc}
            title={`Document ${cert.title}`}
          />
        ) : cert.imageUrl ? (
          <img
            src={cert.imageUrl}
            className="img-fluid rounded mb-3"
            alt={`Badge ${cert.title}`}
          />
        ) : null}
        {cert.description ? <p>{cert.description}</p> : null}
        <dl className="row small mb-2">
          <dt className="col-sm-4">Obtenue le</dt>
          <dd className="col-sm-8">{cert.formattedIssueDate()}</dd>
          {cert.expiryDate ? (
            <>
              <dt className="col-sm-4">Expire le</dt>
              <dd className="col-sm-8">{Certification.formatDate(cert.expiryDate)}</dd>
            </>
          ) : null}
          {cert.credentialId ? (
            <>
              <dt className="col-sm-4">Identifiant</dt>
              <dd className="col-sm-8">
                <code>{cert.credentialId}</code>
              </dd>
            </>
          ) : null}
        </dl>
        {cert.skills.length ? (
          <p>
            <span className="small text-muted d-block">Compétences acquises</span>
            {cert.skills.map((s) => (
              <span key={s} className="badge bg-light text-dark border me-1">
                {s}
              </span>
            ))}
          </p>
        ) : null}
        {verify ? (
          <a
            className="btn btn-primary btn-sm"
            href={verify}
            target="_blank"
            rel="noopener noreferrer"
          >
            Vérifier la certification
          </a>
        ) : null}
      </div>
    );
  }
}
