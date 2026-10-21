import { Component } from 'react';
import TimelineItem from './TimelineItem.jsx';

/** Frise verticale groupée par année. Ne se re-rend que si les données ont vraiment changé. */
export default class AwardTimeline extends Component {
  shouldComponentUpdate(next) {
    return (
      next.onSelect !== this.props.onSelect ||
      JSON.stringify(next.groups) !== JSON.stringify(this.props.groups)
    );
  }

  render() {
    const { groups, onSelect } = this.props;
    if (!groups.length)
      return <p className="text-muted">Aucune distinction dans cette catégorie.</p>;
    return (
      <div className="timeline">
        {groups.map((g) => (
          <section key={g.year} aria-label={`Année ${g.year}`}>
            <h3 className="timeline-year">{g.year}</h3>
            <ul className="list-unstyled timeline-list">
              {g.items.map((a) => (
                <TimelineItem key={a.id} award={a} onOpen={onSelect} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }
}
