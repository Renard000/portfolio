import { PureComponent } from 'react';
import NewItemsContext from '../../context/NewItemsContext.js';

/** Pastille rouge NEW sur une publication que ce visiteur n'a pas encore ouverte. */
export default class NewBadge extends PureComponent {
  static contextType = NewItemsContext;

  render() {
    const { itemKey, path, prefix } = this.props;
    if (!this.context.isNew({ key: itemKey, path, prefix })) return null;
    return <span className="pf-new">NEW</span>;
  }
}
