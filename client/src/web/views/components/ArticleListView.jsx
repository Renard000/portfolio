import { PureComponent } from 'react';

/** Vue pure : uniquement des props, aucun accès Redux, service ou API. */
export default class ArticleListView extends PureComponent {
  render() {
    const { items, loading, error } = this.props;
    if (loading) return <p className="text-muted">Chargement…</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!items.length) return <p className="text-muted">Aucun article pour le moment.</p>;
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
