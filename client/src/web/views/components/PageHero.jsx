import { PureComponent } from 'react';

/** En-tête de page : étiquette, gros titre (dont une partie en contour), contenu à droite. */
export default class PageHero extends PureComponent {
  render() {
    const { kicker, title, outline, children } = this.props;
    return (
      <div className="pf-row pf-between" style={{ alignItems: 'flex-end' }}>
        <div>
          {kicker ? <span className="pf-kicker">{kicker}</span> : null}
          <h1 className="pf-h1 pf-h1--md pf-rise" style={{ marginTop: 14 }}>
            {title} {outline ? <span className="pf-out">{outline}</span> : null}
          </h1>
        </div>
        {children}
      </div>
    );
  }
}
