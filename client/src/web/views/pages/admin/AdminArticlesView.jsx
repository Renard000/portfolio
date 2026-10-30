import { Component } from 'react';
import { Link } from 'react-router-dom';
import AdminHeader from '../../components/AdminHeader.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import DataTable from '../../components/DataTable.jsx';

/** Liste des articles (maquette A-03) : onglets de statut, tableau, actions. */
export default class AdminArticlesView extends Component {
  renderActions = (row) => (
    <>
      <Link
        className="btn btn-sm btn-outline-primary me-1"
        to={`/admin/articles/${row.id}`}
        aria-label={`Modifier ${row.title}`}
      >
        <i className="fa-solid fa-pen" aria-hidden="true" />
      </Link>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary me-1"
        onClick={() => this.props.onTogglePublish(row)}
        aria-label={`${row.status === 'published' ? 'Dépublier' : 'Publier'} ${row.title}`}
        title={row.status === 'published' ? 'Dépublier' : 'Publier et notifier'}
      >
        <i
          className={`fa-solid ${row.status === 'published' ? 'fa-eye-slash' : 'fa-paper-plane'}`}
          aria-hidden="true"
        />
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-danger"
        onClick={() => this.props.onAskDelete(row)}
        aria-label={`Supprimer ${row.title}`}
      >
        <i className="fa-solid fa-trash" aria-hidden="true" />
      </button>
    </>
  );

  render() {
    const { rows, columns, tabs, tab, loading, error, deleting } = this.props;
    const { onTab, onExport, onConfirmDelete, onCancelDelete } = this.props;
    return (
      <section className="pf-col" style={{ gap: 24 }}>
        <AdminHeader title="Articles">
          <Link className="pf-btn pf-btn--pri" to="/admin/articles/nouveau">
            + Ajouter
          </Link>
        </AdminHeader>
        <div className="pf-row" role="group" aria-label="Filtrer par statut">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`pf-chip${tab === t.key ? ' is-on' : ''}`}
              aria-pressed={tab === t.key}
              onClick={() => onTab(t.key)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        {error ? (
          <p className="pf-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="pf-card" style={{ padding: 16 }}>
          {loading && !rows.length ? (
            <p className="pf-mu" role="status">
              Chargement…
            </p>
          ) : (
            <DataTable
              rows={rows}
              columns={columns}
              renderActions={this.renderActions}
              onExport={onExport}
              caption="Articles"
              emptyMessage="Aucun article."
            />
          )}
        </div>
        {deleting ? (
          <ConfirmModal
            title="Confirmer la suppression"
            message={`Supprimer « ${deleting.title} » et ses commentaires ? Cette action est définitive.`}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : null}
      </section>
    );
  }
}
