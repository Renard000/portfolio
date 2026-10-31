import { PureComponent } from 'react';
import withLocale from '../../context/withLocale.jsx';

const STYLE = { valid: 'bg-success', expired: 'bg-danger', 'no-expiry': 'bg-secondary' };
const LABEL = { valid: 'Valide', expired: 'Expirée', 'no-expiry': 'Sans expiration' };

class StatusBadge extends PureComponent {
  render() {
    const { status } = this.props;
    return (
      <span className={`badge ${STYLE[status] || 'bg-secondary'}`}>
        {this.props.t(LABEL[status])}
      </span>
    );
  }
}

export default withLocale(StatusBadge);
