import { PureComponent } from 'react';

const STYLE = { valid: 'bg-success', expired: 'bg-danger', 'no-expiry': 'bg-secondary' };
const LABEL = { valid: 'Valide', expired: 'Expirée', 'no-expiry': 'Sans expiration' };

export default class StatusBadge extends PureComponent {
  render() {
    const { status } = this.props;
    return (
      <span className={`badge ${STYLE[status] || 'bg-secondary'}`}>{LABEL[status]}</span>
    );
  }
}
