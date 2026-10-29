import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading.jsx';
import SeriesCard from './SeriesCard.jsx';

export default class FeaturedSeries extends PureComponent {
  render() {
    const { items } = this.props;
    if (!items.length) return null;
    return (
      <section className="pf-wrap pf-sec" aria-labelledby="home-series">
        <SectionHeading kicker="Formations" title="Dernières formations" id="home-series">
          <Link className="pf-btn" to="/formations">
            Toutes les formations →
          </Link>
        </SectionHeading>
        <div className="pf-grid3">
          {items.map((s) => (
            <SeriesCard key={s.slug} series={s} />
          ))}
        </div>
      </section>
    );
  }
}
FeaturedSeries.defaultProps = { items: [] };
