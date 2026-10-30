import { Component, PureComponent } from 'react';
import { Link } from 'react-router-dom';

class Toast extends Component {
  componentDidMount() {
    const { toast, onDismiss } = this.props;
    this.timer = setTimeout(() => onDismiss(toast.id), toast.duration);
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const { toast, onDismiss } = this.props;
    return (
      <div className="pf-toast" role="status">
        <Link
          to={toast.to}
          className="pf-toast__body"
          onClick={() => onDismiss(toast.id)}
        >
          <span className="pf-mono pf-lime">{toast.title}</span>
          <span>{toast.text}</span>
        </Link>
        <button
          type="button"
          className="pf-toast__close"
          aria-label="Fermer la notification"
          onClick={() => onDismiss(toast.id)}
        >
          ×
        </button>
      </div>
    );
  }
}

/** Alertes en bas de l'écran : se ferment seules, ou au clic. */
export default class ToastStack extends PureComponent {
  render() {
    const { toasts, onDismiss } = this.props;
    if (!toasts.length) return null;
    return (
      <div className="pf-toasts" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </div>
    );
  }
}
ToastStack.defaultProps = { toasts: [] };
