import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchAdminArticles,
  setArticlePublished,
  deleteArticle,
} from '../store/slices/adminArticlesSlice.js';
import ArticleService from '../../bll/services/ArticleService.js';
import { toCsv } from '../../bll/services/CsvService.js';
import { downloadTextFile } from '../utils/download.js';
import AdminArticlesView from '../views/pages/admin/AdminArticlesView.jsx';

const isPublished = (a) => a.status === 'published';

export const ARTICLE_COLUMNS = [
  { key: 'title', label: 'Titre', value: (a) => a.title },
  { key: 'category', label: 'Catégorie', value: (a) => a.category || '' },
  {
    key: 'status',
    label: 'Statut',
    value: (a) => (isPublished(a) ? 'Publié' : 'Brouillon'),
    render: (a) => (
      <span
        className={`pf-chip${isPublished(a) ? ' is-on' : ''}`}
        style={{ cursor: 'default' }}
      >
        {isPublished(a) ? 'Publié' : 'Brouillon'}
      </span>
    ),
  },
  { key: 'views', label: 'Vues', value: (a) => (isPublished(a) ? a.views : '—') },
  { key: 'likes', label: '♥', value: (a) => (isPublished(a) ? a.likes : '—') },
  {
    key: 'publishedAt',
    label: 'Publié le',
    value: (a) => a.publishedAt || '',
    render: (a) =>
      a.publishedAt ? ArticleService.formatDate(a.publishedAt, false) : '—',
  },
];

const TABS = [
  { key: 'all', label: 'Tous', test: () => true },
  { key: 'published', label: 'Publiés', test: isPublished },
  { key: 'draft', label: 'Brouillons', test: (a) => !isPublished(a) },
];

class AdminArticlesController extends Component {
  state = { tab: 'all', deleting: null };

  componentDidMount() {
    this.props.fetchAdminArticles();
  }

  setTab = (tab) => this.setState({ tab });
  togglePublish = (row) =>
    this.props.setArticlePublished({ id: row.id, published: !isPublished(row) });
  askDelete = (row) => this.setState({ deleting: row });
  cancelDelete = () => this.setState({ deleting: null });
  confirmDelete = async () => {
    const { deleting } = this.state;
    this.setState({ deleting: null });
    await this.props.deleteArticle(deleting.id);
  };

  exportCsv = (rows) =>
    downloadTextFile(
      'articles.csv',
      toCsv(
        rows,
        ARTICLE_COLUMNS.map((c) => ({ label: c.label, value: c.value }))
      )
    );

  render() {
    const { items, loading, error } = this.props;
    const current = TABS.find((t) => t.key === this.state.tab);
    return (
      <AdminArticlesView
        rows={items.filter(current.test)}
        columns={ARTICLE_COLUMNS}
        tabs={TABS.map((t) => ({ ...t, count: items.filter(t.test).length }))}
        tab={this.state.tab}
        loading={loading}
        error={error}
        deleting={this.state.deleting}
        onTab={this.setTab}
        onTogglePublish={this.togglePublish}
        onAskDelete={this.askDelete}
        onConfirmDelete={this.confirmDelete}
        onCancelDelete={this.cancelDelete}
        onExport={this.exportCsv}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.adminArticles.items,
  loading: s.adminArticles.loading,
  error: s.adminArticles.error,
});
export default connect(mapState, {
  fetchAdminArticles,
  setArticlePublished,
  deleteArticle,
})(AdminArticlesController);
