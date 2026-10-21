import { PureComponent } from 'react';
import Modal from './Modal.jsx';

export default class ConfirmModal extends PureComponent {
  render() {
    const { title, message, onConfirm, onCancel, confirmLabel } = this.props;
    return (
      <Modal
        title={title}
        onClose={onCancel}
        size="modal-sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Annuler
            </button>
            <button type="button" className="btn btn-danger" onClick={onConfirm}>
              {confirmLabel || 'Supprimer'}
            </button>
          </>
        }
      >
        <p className="mb-0">{message}</p>
      </Modal>
    );
  }
}
