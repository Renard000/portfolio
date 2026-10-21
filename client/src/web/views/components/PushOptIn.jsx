import { PureComponent } from 'react';

const MESSAGES = {
  subscribed: ['text-success', 'Notifications activées.'],
  unavailable: [
    'text-muted',
    'Notifications indisponibles (permission refusée ou navigateur non compatible).',
  ],
  error: ['text-danger', "Impossible d'activer les notifications."],
};

export default class PushOptIn extends PureComponent {
  render() {
    const { status, onEnable } = this.props;
    const msg = MESSAGES[status];
    return (
      <div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onEnable}
          disabled={status === 'loading' || status === 'subscribed'}
        >
          <i className="fa-regular fa-bell me-1" aria-hidden="true" /> Activer les
          notifications
        </button>
        {msg ? (
          <p className={`small mt-2 mb-0 ${msg[0]}`} role="status">
            {msg[1]}
          </p>
        ) : null}
      </div>
    );
  }
}
