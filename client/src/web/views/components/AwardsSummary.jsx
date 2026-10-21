import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AwardTotals from './AwardTotals.jsx';
import DataFetcher from './DataFetcher.jsx';

/** Résumé des distinctions pour l'accueil : charge ses données via le render prop DataFetcher. */
export default class AwardsSummary extends PureComponent {
  render() {
    return (
      <section className="mb-5" aria-labelledby="awards-title">
        <div className="d-flex justify-content-between align-items-baseline">
          <h2 id="awards-title" className="h4">
            Bourses et mérites
          </h2>
          <Link to="/distinctions">Voir la frise</Link>
        </div>
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
