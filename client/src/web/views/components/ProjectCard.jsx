import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import NewBadge from './NewBadge.jsx';
import Thumb from './Thumb.jsx';

export default class ProjectCard extends PureComponent {
  render() {
    const { project: p, height = 220 } = this.props;
    return (
      <Link
        to={`/projets/${p.slug}`}
        className="pf-card"
        style={{ padding: 14 }}
        aria-label={`Projet ${p.title}`}
      >
        <NewBadge path={`/projets/${p.slug}`} />
        <Thumb
          color={p.color}
          kind={p.kind}
          height={height}
          imageUrl={p.imageUrl}
          alt={p.title}
        />
        <div className="pf-col" style={{ gap: 8, padding: '14px 10px 10px' }}>
          <div className="pf-row pf-between">
            <span className="pf-mono">{p.category}</span>
            <span className="pf-lime" aria-hidden="true">
              ↗
            </span>
          </div>
          <h3 className="pf-h3">{p.title}</h3>
          <div className="pf-row" style={{ gap: 6 }}>
            {(p.tech || []).map((t) => (
              <span key={t} className="pf-k">
                {t}
              </span>
            ))}
          </div>
        </div>
      </Link>
    );
  }
}
