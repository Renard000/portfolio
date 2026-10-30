import { PureComponent } from 'react';

/**
 * Case des formulaires de création : décochée, le contenu est ajouté sans écrire aux
 * abonnés (utile pour saisir d'anciens contenus). À la modification, rien n'est envoyé.
 */
export default class NotifyCheckbox extends PureComponent {
  render() {
    const { id, checked, onChange } = this.props;
    return (
      <div className="col-12">
        <div className="form-check">
          <input
            id={id}
            type="checkbox"
            className="form-check-input"
            checked={checked}
            onChange={onChange}
          />
          <label htmlFor={id} className="form-check-label">
            Notifier les abonnés (courriel et push)
          </label>
        </div>
      </div>
    );
  }
}
