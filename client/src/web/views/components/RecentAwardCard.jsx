import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import Award from '../../../domain/models/Award.js';
import Certification from '../../../domain/models/Certification.js';

/** Carte d'une distinction récente sur l'accueil : renvoie vers la frise. */
export default class RecentAwardCard extends PureComponent {
  render() {
    const award = new Award(this.props.award);
    return (
      <Link to="/distinctions" className="pf-card" aria-label={`Distinction ${award.title}`}>
        <div className="pf-col" style={{ gap: 10 }}>
          <div className="pf-row pf-between">
            <span className="pf-chip" style={{ cursor: 'default' }}>
              {award.typeLabel()}
            </span>
            <span className="pf-mono">{Certification.formatDate(award.awardedAt)}</span>
          </div>
          <h3 className="pf-h3">{award.title}</h3>
          <span className="pf-mu">{award.organization}</span>
          {award.hasAmount() ? (
            <span className="pf-lime">{award.formattedAmount()}</span>
          ) : null}
        </div>
      </Link>
    );
  }
}
