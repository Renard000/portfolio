import { PureComponent } from 'react';
import { Link } from 'react-router-dom';

/** Confirmation ou désinscription de la newsletter (maquette P-14). */
export default class NewsletterStatusPage extends PureComponent {
  render() {
    const { page } = this.props;
    const ok = page.symbol === '✓';
    return (
      <main className="pf-wrap" style={{ paddingTop: 'clamp(64px,10vw,120px)' }}>
        <div
          className="pf-card pf-col pf-rise"
          style={{
            padding: 'clamp(28px,5vw,64px)',
            alignItems: 'flex-start',
            minHeight: 420,
            justifyContent: 'center',
            gap: 20,
          }}
          role={ok ? 'status' : 'alert'}
        >
          <span className="pf-mono pf-lime">{page.kicker}</span>
          <span
            className="pf-h1 pf-lime"
            style={{ fontSize: 'clamp(4.5rem,12vw,7rem)' }}
            aria-hidden="true"
          >
            {page.symbol}
          </span>
          <h1 className="pf-h2" style={{ fontSize: '2.25rem' }}>
            {page.title}
          </h1>
          <p className="pf-mu" style={{ margin: 0, maxWidth: '40rem' }}>
            {page.message}
          </p>
          <Link className={`pf-btn${ok ? '' : ' pf-btn--pri'}`} to={page.action.to}>
            {page.action.label}
          </Link>
        </div>
      </main>
    );
  }
}
