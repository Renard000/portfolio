import { PureComponent } from 'react';

/** Titre d'un écran admin et ses actions à droite (maquettes A-02 à A-08). */
export default class AdminHeader extends PureComponent {
  render() {
    const { title, children } = this.props;
    return (
      <div className="pf-row pf-between">
        <h1 className="pf-h2 pf-admin__title">{title}</h1>
        {children ? <div className="pf-row">{children}</div> : null}
      </div>
    );
  }
}
