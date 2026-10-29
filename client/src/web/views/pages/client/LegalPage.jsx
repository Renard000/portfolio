import { PureComponent } from 'react';
import { Link } from 'react-router-dom';

export default class LegalPage extends PureComponent {
  render() {
    const { doc } = this.props;
    return (
      <main
        className="pf-wrap"
        style={{ paddingTop: 'clamp(48px,8vw,90px)', maxWidth: 860 }}
      >
        <span className="pf-kicker">Légal</span>
        <h1 className="pf-h1 pf-h1--md" style={{ margin: '14px 0 12px' }}>
          {doc.title}
        </h1>
        <p className="pf-mono">Dernière mise à jour : {doc.updated}</p>
        <div className="pf-col" style={{ gap: 32, marginTop: 40 }}>
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="pf-h3" style={{ marginBottom: 8 }}>
                {s.heading}
              </h2>
              <p className="pf-mu" style={{ margin: 0 }}>
                {s.body}
              </p>
            </section>
          ))}
        </div>
        <p style={{ marginTop: 48 }}>
          <Link to="/">← Retour à l’accueil</Link>
        </p>
      </main>
    );
  }
}
