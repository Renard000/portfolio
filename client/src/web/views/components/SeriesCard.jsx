import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import Video from '../../../domain/models/Video.js';
import Thumb from './Thumb.jsx';

const PALETTE = ['#3b2f8f', '#0f5e4d', '#8a3a24', '#24507a', '#6b3b8f'];
export const seriesColor = (slug) =>
  PALETTE[[...String(slug)].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

export default class SeriesCard extends PureComponent {
  render() {
    const { series: s } = this.props;
    return (
      <Link
        to={`/formations/${s.slug}`}
        className="pf-card"
        style={{ padding: 14 }}
        aria-label={`Série ${s.title}`}
      >
        <Thumb
          color={seriesColor(s.slug)}
          kind={0}
          height={200}
          imageUrl={s.posterUrl || s.coverUrl}
          alt={s.title}
        />
        <div className="pf-col" style={{ gap: 10, padding: '16px 10px 8px' }}>
          <div className="pf-row pf-between">
            <span className="pf-chip" style={{ cursor: 'default' }}>
              {Video.levelLabel(s.level)}
            </span>
            <span className="pf-mono">
              {s.videoCount} vidéo{s.videoCount > 1 ? 's' : ''} ·{' '}
              {Video.formatTotal(s.totalDurationSeconds)}
            </span>
          </div>
          <h3 className="pf-h3">{s.title}</h3>
          {s.category ? <span className="pf-mu">{s.category}</span> : null}
        </div>
      </Link>
    );
  }
}
