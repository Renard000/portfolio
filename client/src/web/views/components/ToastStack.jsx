import { Component, PureComponent } from 'react';
import { Link } from 'react-router-dom';
import withLocale from '../../context/withLocale.jsx';

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
          <span className="pf-mono pf-lime">{this.props.t(toast.title)}</span>
          <span>{toast.text}</span>
        </Link>
        <button
          type="button"
          className="pf-toast__close"
          aria-label={this.props.t('Fermer la notification')}
          onClick={() => onDismiss(toast.id)}
        >
          ×
        </button>
      </div>
    );
  }
}

/** Alertes en bas de l'écran : se ferment seules, ou au clic. */
class ToastStack extends PureComponent {
  render() {
    const { toasts, onDismiss } = this.props;
    if (!toasts.length) return null;
    return (
      <div className="pf-toasts" aria-live="polite">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} onDismiss={onDismiss} t={this.props.t} />
        ))}
      </div>
    );
  }
}
ToastStack.defaultProps = { toasts: [] };

export default withLocale(ToastStack);
