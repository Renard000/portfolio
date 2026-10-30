import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import SectionHeading from './SectionHeading.jsx';

/** Section « ajoutés récemment » de l'accueil : invisible tant qu'elle est vide. */
export default class HomeRecentSection extends PureComponent {
  render() {
    const { id, kicker, title, to, linkLabel, count, children } = this.props;
    if (!count) return null;
    return (
      <section className="pf-wrap pf-sec" aria-labelledby={id}>
        <SectionHeading kicker={kicker} title={title} id={id}>
          <Link className="pf-btn" to={to}>
            {linkLabel} →
          </Link>
        </SectionHeading>
        <div className="pf-grid3">{children}</div>
      </section>
    );
  }
}
