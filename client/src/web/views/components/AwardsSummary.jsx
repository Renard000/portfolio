import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import AwardTotals from './AwardTotals.jsx';
import DataFetcher from './DataFetcher.jsx';
import SectionHeading from './SectionHeading.jsx';
import withLocale from '../../context/withLocale.jsx';

/** Résumé des distinctions pour l'accueil : charge ses données via le render prop DataFetcher. */
class AwardsSummary extends PureComponent {
  render() {
    return (
      <section className="pf-sec" aria-labelledby="awards-title">
        <SectionHeading
          kicker={this.props.t('Distinctions')}
          title={this.props.t('Bourses et mérites')}
          id="awards-title"
        >
          <Link className="pf-btn" to="/distinctions">
            {this.props.t('Voir la frise →')}
          </Link>
        </SectionHeading>
        <DataFetcher load={this.props.load}>
          {({ data, loading, error }) => {
            if (loading)
              return <p className="text-muted">{this.props.t('Chargement…')}</p>;
            if (error) return <p className="text-danger">{error}</p>;
            return <AwardTotals totals={data.totals} />;
          }}
        </DataFetcher>
      </section>
    );
  }
}

export default withLocale(AwardsSummary);
