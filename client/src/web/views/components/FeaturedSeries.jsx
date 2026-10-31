import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading.jsx';
import SeriesCard from './SeriesCard.jsx';
import withLocale from '../../context/withLocale.jsx';

class FeaturedSeries extends PureComponent {
  render() {
    const { items } = this.props;
    return (
      <section className="pf-wrap pf-sec" aria-labelledby="home-series">
        <SectionHeading
          kicker={this.props.t('Formations')}
          title={this.props.t('Dernières formations')}
          id="home-series"
        >
          <Link className="pf-btn" to="/formations">
            {this.props.t('Toutes les formations →')}
          </Link>
        </SectionHeading>
        {items.length ? (
          <div className="pf-grid3">
            {items.map((s) => (
              <SeriesCard key={s.slug} series={s} />
            ))}
          </div>
        ) : (
          <p className="pf-mu">
            {this.props.t('Aucune formation publiée pour l’instant.')}
          </p>
        )}
      </section>
    );
  }
}
FeaturedSeries.defaultProps = { items: [] };

export default withLocale(FeaturedSeries);
