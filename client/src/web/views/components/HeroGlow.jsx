import { Component, createRef } from 'react';

/** Zone dont le halo lumineux suit la souris (variables CSS --mx / --my, via Ref + rAF). */
export default class HeroGlow extends Component {
  ref = createRef();
  frame = null;

  componentDidMount() {
    this.ref.current.addEventListener('mousemove', this.handleMove);
  }

  componentWillUnmount() {
    if (this.ref.current)
      this.ref.current.removeEventListener('mousemove', this.handleMove);
    if (this.frame) cancelAnimationFrame(this.frame);
  }

  handleMove = (e) => {
    if (this.frame) return;
    const { clientX, clientY } = e;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      const el = this.ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - r.left}px`);
      el.style.setProperty('--my', `${clientY - r.top}px`);
    });
  };

  render() {
    return (
      <div ref={this.ref} className={`pf-glow ${this.props.className || ''}`}>
        {this.props.children}
      </div>
    );
  }
}
