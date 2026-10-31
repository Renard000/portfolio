import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import CertificationCard from './CertificationCard.jsx';
import withLocale from '../../context/withLocale.jsx';

class FeaturedCertifications extends PureComponent {
  render() {
    const { items, onOpen } = this.props;
    if (!items.length) return null;
    return (
      <section className="pf-sec" aria-labelledby="featured-title">
        <div className="d-flex justify-content-between align-items-baseline">
          <h2 id="featured-title" className="h4">
            {this.props.t('Certifications en vedette')}
          </h2>
          <Link to="/certifications">{this.props.t('Toutes les certifications')}</Link>
        </div>
        <div className="row g-3">
          {items.map((c) => (
            <div key={c.id} className="col-12 col-sm-6 col-lg-4">
              <CertificationCard certification={c} onOpen={onOpen} />
            </div>
          ))}
        </div>
      </section>
    );
  }
}
FeaturedCertifications.defaultProps = { items: [] };

export default withLocale(FeaturedCertifications);
