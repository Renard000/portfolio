import { Component } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Compte de 0 jusqu'à `value` avec setInterval ; nettoie le minuteur au démontage. */
export default class AnimatedCounter extends Component {
  state = { display: 0 };
  timer = null;

  componentDidMount() {
    this.start();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) this.start();
  }

  componentWillUnmount() {
    this.stop();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  start() {
    this.stop();
    const target = Number(this.props.value) || 0;
    const { duration = 800, steps = 20 } = this.props;
    if (target === 0 || prefersReducedMotion()) {
      this.setState({ display: target });
      return;
    }
    let step = 0;
    this.setState({ display: 0 });
    this.timer = setInterval(() => {
      step += 1;
      if (step >= steps) {
        this.stop();
        this.setState({ display: target });
      } else {
        this.setState({ display: Math.round((target * step) / steps) });
      }
    }, duration / steps);
  }

  render() {
    return (
      <span className={this.props.className} aria-label={String(this.props.value)}>
        {this.state.display}
      </span>
    );
  }
}
