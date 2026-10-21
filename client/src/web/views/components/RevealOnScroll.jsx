import { Component, createRef } from 'react';

/** Révèle son contenu quand il entre dans l'écran (Ref + IntersectionObserver). */
export default class RevealOnScroll extends Component {
  ref = createRef();
  observer = null;
  state = { visible: typeof IntersectionObserver === 'undefined' };

  componentDidMount() {
    if (this.state.visible || !this.ref.current) return;
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          this.setState({ visible: true });
          this.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.ref.current);
  }

  componentWillUnmount() {
    this.disconnect();
  }

  disconnect() {
    if (this.observer) this.observer.disconnect();
    this.observer = null;
  }

  render() {
    return (
      <div
        ref={this.ref}
        className={`reveal ${this.state.visible ? 'reveal--visible' : ''}`}
      >
        {this.props.children}
      </div>
    );
  }
}
