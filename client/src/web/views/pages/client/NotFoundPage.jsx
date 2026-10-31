import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import withLocale from '../../../context/withLocale.jsx';

class NotFoundPage extends PureComponent {
  render() {
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(64px,10vw,120px)' }}>
        <div
          className="pf-card pf-col"
          style={{
            padding: 'clamp(28px,5vw,64px)',
            alignItems: 'flex-start',
            minHeight: 380,
            justifyContent: 'center',
          }}
        >
          <span className="pf-mono pf-lime">{this.props.t('Introuvable')}</span>
          <h1 className="pf-h1 pf-lime" style={{ fontSize: 'clamp(5rem,16vw,12rem)' }}>
            404
          </h1>
          <h2 className="pf-h2" style={{ fontSize: '2rem' }}>
            {this.props.t('Cette page a pris le large.')}
          </h2>
          <p className="pf-mu" style={{ margin: 0 }}>
            {this.props.t('Page introuvable.')}
          </p>
          <Link className="pf-btn pf-btn--pri" to="/">
            {this.props.t('Retour à l’accueil')}
          </Link>
        </div>
      </main>
    );
  }
}

export default withLocale(NotFoundPage);
