import { PureComponent } from 'react';

/** Bandeau défilant sans fin : la liste est dupliquée (la copie est cachée aux lecteurs d'écran). */
export default class Marquee extends PureComponent {
  renderTrack(hidden) {
    return (
      <div className="pf-marq__track" aria-hidden={hidden || undefined}>
        {this.props.items.map((t) => (
          <span key={t}>
            {t} <span className="pf-lime">✦</span>
          </span>
        ))}
      </div>
    );
  }

  render() {
    return (
      <div className="pf-marq" role="list" aria-label="Technologies">
        {this.renderTrack(false)}
        {this.renderTrack(true)}
      </div>
    );
  }
}
Marquee.defaultProps = { items: [] };
