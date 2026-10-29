import { Component } from 'react';
import { Link } from 'react-router-dom';
import Video from '../../../domain/models/Video.js';
import ConfirmModal from './ConfirmModal.jsx';
import Modal from './Modal.jsx';

export default class AdminSeriesView extends Component {
  render() {
    const {
      series,
      loading,
      error,
      editing,
      deleting,
      renderForm,
      onCreate,
      onEdit,
      onAskDelete,
      onMove,
      onConfirmDelete,
      onCancelDelete,
      onCancelEdit,
    } = this.props;
    if (!series)
      return loading ? (
        <p className="text-muted">Chargement…</p>
      ) : (
        <div className="alert alert-danger" role="alert">
          {error || 'Série introuvable.'}
        </div>
      );
    const videos = series.videos || [];
    return (
      <section>
        <p>
          <Link to="/admin/formations">← Toutes les séries</Link>
        </p>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 mb-0">{series.title}</h1>
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            + Ajouter une vidéo
          </button>
        </div>
        {error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : null}
        <div className="table-responsive">
          <table className="table align-middle">
            <caption className="visually-hidden">Vidéos de la série</caption>
            <thead>
              <tr>
                <th>#</th>
                <th>Titre</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Vues</th>
                <th>Ordre</th>
                <th>
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {videos.length ? (
                videos.map((v, i) => (
                  <tr key={v.id}>
                    <td>{v.position}</td>
                    <td>{v.title}</td>
                    <td>{Video.formatDuration(v.durationSeconds)}</td>
                    <td>
                      {v.status === 'published' ? (
                        <span className="badge bg-success">Publiée</span>
                      ) : (
                        <span className="badge bg-secondary">Brouillon</span>
                      )}
                    </td>
                    <td>{v.views}</td>
                    <td className="text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        disabled={i === 0}
                        aria-label={`Monter ${v.title}`}
                        onClick={() => onMove(v.id, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={i === videos.length - 1}
                        aria-label={`Descendre ${v.title}`}
                        onClick={() => onMove(v.id, 1)}
                      >
                        ▼
                      </button>
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        aria-label={`Modifier ${v.title}`}
                        onClick={() => onEdit(v)}
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        aria-label={`Supprimer ${v.title}`}
                        onClick={() => onAskDelete(v)}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-muted text-center">
                    Aucune vidéo dans cette série.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {editing ? (
          <Modal
            title={editing.id ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
            onClose={onCancelEdit}
          >
            {renderForm(editing.id ? editing : null)}
          </Modal>
        ) : null}
        {deleting ? (
          <ConfirmModal
            title="Confirmer la suppression"
            message={`Supprimer « ${deleting.title} » ? Le fichier S3 sera aussi supprimé.`}
            onConfirm={onConfirmDelete}
            onCancel={onCancelDelete}
          />
        ) : null}
      </section>
    );
  }
}
