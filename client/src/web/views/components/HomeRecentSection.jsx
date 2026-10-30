import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading.jsx';

/** Section « ajoutés récemment » de l'accueil : toujours visible, même sans contenu. */
export default class HomeRecentSection extends PureComponent {
  render() {
    const { id, kicker, title, to, linkLabel, count, emptyMessage, children } =
      this.props;
    return (
      <section className="pf-wrap pf-sec" aria-labelledby={id}>
        <SectionHeading kicker={kicker} title={title} id={id}>
          <Link className="pf-btn" to={to}>
            {linkLabel} →
          </Link>
        </SectionHeading>
        {count ? (
          <div className="pf-grid3">{children}</div>
        ) : (
          <p className="pf-mu">{emptyMessage}</p>
        )}
      </section>
    );
  }
}
