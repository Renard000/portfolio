import { Component } from 'react';
import { createPortal } from 'react-dom';

/** Modal rendue dans document.body via un Portal. Échap et clic sur le fond la ferment. */
export default class Modal extends Component {
  componentDidMount() {
    document.addEventListener('keydown', this.handleKey);
    document.body.classList.add('modal-open');
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKey);
    document.body.classList.remove('modal-open');
  }

  handleKey = (e) => {
    if (e.key === 'Escape') this.props.onClose();
  };

  stop = (e) => e.stopPropagation();

  render() {
    const { title, onClose, children, footer, size } = this.props;
    return createPortal(
      <div>
        <div className="modal show d-block" tabIndex="-1" onClick={onClose}>
          <div
            className={`modal-dialog modal-dialog-scrollable ${size || 'modal-lg'}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={this.stop}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title h5">{title}</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Fermer"
                  onClick={onClose}
                />
              </div>
              <div className="modal-body">{children}</div>
              {footer ? <div className="modal-footer">{footer}</div> : null}
            </div>
          </div>
        </div>
        <div className="modal-backdrop show" />
      </div>,
      document.body
    );
  }
}
