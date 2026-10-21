import { Component, createRef } from 'react';
import CertificationCard from './CertificationCard.jsx';

const isEditable = (el) =>
  el && el.closest && el.closest('input, textarea, select, [contenteditable=true]');

/** Carrousel en classe : state.index, boutons, flèches du clavier (écouteur de document). */
export default class CertificationCarousel extends Component {
  state = { index: 0, prevItems: this.props.items };
  dotRefs = [];
  rootRef = createRef();

  /** Quand la liste filtrée change, on revient à la première carte. */
  static getDerivedStateFromProps(props, state) {
    if (props.items !== state.prevItems) return { index: 0, prevItems: props.items };
    return null;
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKey);
  }

  componentDidUpdate(_prevProps, prevState) {
    if (prevState.index !== this.state.index) {
      const dot = this.dotRefs[this.state.index];
      if (dot && typeof dot.scrollIntoView === 'function')
        dot.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKey);
  }

  handleKey = (e) => {
    if (isEditable(e.target)) return; // ne pas voler les flèches d'un champ de saisie
    if (e.key === 'ArrowLeft') this.prev();
    else if (e.key === 'ArrowRight') this.next();
  };

  go(delta) {
    const n = this.props.items.length;
    if (!n) return;
    this.setState((s) => ({ index: (s.index + delta + n) % n }));
  }
  prev = () => this.go(-1);
  next = () => this.go(1);

  render() {
    const { items, onOpen } = this.props;
    if (!items.length)
      return <p className="text-muted">Aucune certification à afficher.</p>;
    const current = items[this.state.index];
    this.dotRefs = [];
    return (
      <div
        className="certification-carousel"
        ref={this.rootRef}
        aria-roledescription="carrousel"
      >
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label="Précédente"
            onClick={this.prev}
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <div className="flex-grow-1" aria-live="polite">
            <CertificationCard certification={current} onOpen={onOpen} />
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary"
            aria-label="Suivante"
            onClick={this.next}
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
        <p className="text-center text-muted small mt-2 mb-1">
          {this.state.index + 1} / {items.length}
        </p>
        <div className="carousel-dots d-flex gap-1 justify-content-center flex-wrap">
          {items.map((c, i) => (
            <button
              key={c.id}
              type="button"
              ref={(el) => (this.dotRefs[i] = el)}
              className={`carousel-dot ${i === this.state.index ? 'active' : ''}`}
              aria-label={`Aller à ${c.title}`}
              aria-current={i === this.state.index}
              onClick={() => this.setState({ index: i })}
            />
          ))}
        </div>
      </div>
    );
  }
}
