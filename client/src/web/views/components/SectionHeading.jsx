import { PureComponent } from 'react';

export default class SectionHeading extends PureComponent {
  render() {
    const { kicker, title, id, children } = this.props;
    return (
      <div className="pf-sh">
        <div className="pf-col" style={{ gap: 10 }}>
          <span className="pf-kicker">{kicker}</span>
          <h2 id={id} className="pf-h2">
            {title}
          </h2>
        </div>
        {children}
      </div>
    );
  }
}
