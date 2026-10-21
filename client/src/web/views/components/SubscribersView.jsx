import { Component } from 'react';
import ConfirmModal from './ConfirmModal.jsx';
import DataTable from './DataTable.jsx';

const yn = (v) => (v ? 'Oui' : 'Non');
const day = (v) => (v ? String(v).slice(0, 10) : '');

export const NEWSLETTER_COLUMNS = [
  { key: 'email', label: 'Courriel', value: (r) => r.email },
  { key: 'confirmed', label: 'Confirmé', value: (r) => yn(r.confirmed) },
  { key: 'active', label: 'Actif', value: (r) => yn(r.active) },
  { key: 'createdAt', label: 'Inscrit le', value: (r) => day(r.createdAt) },
];
export const PUSH_COLUMNS = [
  { key: 'token', label: 'Jeton', value: (r) => r.token },
  { key: 'active', label: 'Actif', value: (r) => yn(r.active) },
  { key: 'createdAt', label: 'Inscrit le', value: (r) => day(r.createdAt) },
];

export default class SubscribersView extends Component {
  state = { tab: 'newsletter', testTo: '' };

  renderActions = (row) => (
    <button
      type="button"
      className="btn btn-sm btn-outline-danger"
      aria-label="Supprimer"
      onClick={() => this.props.onAskDelete(this.state.tab, row)}
    >
      <i className="fa-solid fa-trash" aria-hidden="true" />
    </button>
  );

  render() {
    const {
      newsletter,
      push,
      loading,
      error,
      deleting,
      testStatus,
      onExport,
      onSendTest,
      onConfirmDelete,
      onCancelDelete,
    } = this.props;
    const { tab } = this.state;
    const isNews = tab === 'newsletter';
    return (
      <section>
        <h1 className="h3">Abonnés</h1>
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}
        <ul className="nav nav-tabs mb-3" role="tablist">
          <li className="nav-item">
            <button
              type="button"
              role="tab"
              aria-selected={isNews}
              className={`nav-link ${isNews ? 'active' : ''}`}
              onClick={() => this.setState({ tab: 'newsletter' })}
            >
              Newsletter ({newsletter.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              role="tab"
              aria-selected={!isNews}
              className={`nav-link ${!isNews ? 'active' : ''}`}
              onClick={() => this.setState({ tab: 'push' })}
            >
              Push ({push.length})
            </button>
          </li>
        </ul>
        {isNews ? (
          <form
            className="input-group mb-3"
            onSubmit={(e) => {
              e.preventDefault();
              onSendTest(this.state.testTo);
            }}
          >
            <label htmlFor="test-to" className="visually-hidden">
              Adresse de test
            </label>
            <input
              id="test-to"
              type="email"
              className="form-control"
              placeholder="Votre adresse pour le courriel de test"
              value={this.state.testTo}
              onChange={(e) => this.setState({ testTo: e.target.value })}
              required
            />
            <button
              type="submit"
              className="btn btn-outline-primary"
              disabled={testStatus === 'loading'}
            >
              Envoyer un courriel de test
            </button>
          </form>
        ) : null}
        {isNews && testStatus === 'sent' ? (
          <p className="text-success small" role="status">
            Courriel de test envoyé.
          </p>
        ) : null}
        {isNews && testStatus === 'error' ? (
          <p className="text-danger small" role="alert">
            Échec de l'envoi du courriel de test.
          </p>
        ) : null}
        {loading ? (
          <p className="text-muted">Chargement…</p>
        ) : (
          <DataTable
            key={tab}
            rows={isNews ? newsletter : push}
            columns={isNews ? NEWSLETTER_COLUMNS : PUSH_COLUMNS}
            renderActions={this.renderActions}
            onExport={(rows) => onExport(tab, rows)}
            caption={isNews ? 'Abonnés newsletter' : 'Abonnements push'}
          />
        )}
        {deleting ? (
          <ConfirmModal
            title="Supprimer l'abonné"
            message={`Supprimer ${deleting.row.email || deleting.row.token} ?`}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : null}
      </section>
    );
  }
}
SubscribersView.defaultProps = { newsletter: [], push: [], testStatus: 'idle' };
