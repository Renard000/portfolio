import { PureComponent } from 'react';
import { Link } from 'react-router-dom';

export default class NotFoundPage extends PureComponent {
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
          <span className="pf-mono pf-lime">Introuvable</span>
          <h1 className="pf-h1 pf-lime" style={{ fontSize: 'clamp(5rem,16vw,12rem)' }}>
            404
          </h1>
          <h2 className="pf-h2" style={{ fontSize: '2rem' }}>
            Cette page a pris le large.
          </h2>
          <p className="pf-mu" style={{ margin: 0 }}>
            Page introuvable.
          </p>
          <Link className="pf-btn pf-btn--pri" to="/">
            Retour à l’accueil
          </Link>
        </div>
      </main>
    );
  }
}
