import { PureComponent } from 'react';
import withLocale from '../../context/withLocale.jsx';

/** Vue pure : uniquement des props, aucun accès Redux, service ou API. */
class ArticleListView extends PureComponent {
  render() {
    const { items, loading, error } = this.props;
    if (loading) return <p className="text-muted">{this.props.t('Chargement…')}</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!items.length)
      return (
        <p className="text-muted">{this.props.t('Aucun article pour le moment.')}</p>
      );
    return (
      <ul className="list-group">
        {items.map((article) => (
          <li key={article.id} className="list-group-item">
            {article.title}
          </li>
        ))}
      </ul>
    );
  }
}

ArticleListView.defaultProps = { items: [], loading: false, error: null };

export default withLocale(ArticleListView);
