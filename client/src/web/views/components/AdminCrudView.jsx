import { Component } from 'react';
import ConfirmModal from './ConfirmModal.jsx';
import DataTable from './DataTable.jsx';
import Modal from './Modal.jsx';

/** Vue admin générique : tableau + modal de formulaire + confirmation de suppression. */
/* Component (et non PureComponent) : renderForm est une référence stable, mais le formulaire
   qu'il produit dépend de l'état du contrôleur (erreur, enregistrement en cours). */
export default class AdminCrudView extends Component {
  renderActions = (row) => (
    <>
      <button
        type="button"
        className="btn btn-sm btn-outline-primary me-1"
        onClick={() => this.props.onEdit(row)}
        aria-label={`Modifier ${row.title}`}
      >
        <i className="fa-solid fa-pen" aria-hidden="true" />
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
    const {
      title,
      rows,
      columns,
      loading,
      error,
      editing,
      deleting,
      renderForm,
      onCreate,
      onExport,
      onCancelEdit,
      onConfirmDelete,
      onCancelDelete,
    } = this.props;
    return (
      <section>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 mb-0">{title}</h1>
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            <i className="fa-solid fa-plus me-1" aria-hidden="true" /> Ajouter
          </button>
        </div>
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}
        {loading && !rows.length ? (
          <p className="text-muted">Chargement…</p>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            renderActions={this.renderActions}
            onExport={onExport}
            caption={title}
          />
        )}
        {editing ? (
          <Modal title={editing.id ? 'Modifier' : 'Ajouter'} onClose={onCancelEdit}>
            {renderForm(editing.id ? editing : null)}
          </Modal>
        ) : null}
        {deleting ? (
          <ConfirmModal
            title="Confirmer la suppression"
            message={`Supprimer « ${deleting.title} » ? Cette action est définitive.`}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : null}
      </section>
    );
  }
}
AdminCrudView.defaultProps = { rows: [] };
