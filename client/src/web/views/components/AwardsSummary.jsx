import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AwardTotals from './AwardTotals.jsx';
import DataFetcher from './DataFetcher.jsx';
import SectionHeading from './SectionHeading.jsx';

/** Résumé des distinctions pour l'accueil : charge ses données via le render prop DataFetcher. */
export default class AwardsSummary extends PureComponent {
  render() {
    return (
      <section className="pf-sec" aria-labelledby="awards-title">
        <SectionHeading
          kicker="Distinctions"
          title="Bourses et mérites"
          id="awards-title"
        >
          <Link className="pf-btn" to="/distinctions">
            Voir la frise →
          </Link>
        </SectionHeading>
        <DataFetcher load={this.props.load}>
          {({ data, loading, error }) => {
            if (loading) return <p className="text-muted">Chargement…</p>;
            if (error) return <p className="text-danger">{error}</p>;
            return <AwardTotals totals={data.totals} />;
          }}
        </DataFetcher>
      </section>
    );
  }
}
