import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchArticles, setArticleFilter } from '../store/slices/articlesSlice.js';
import ArticleService from '../../bll/services/ArticleService.js';
import BlogPage from '../views/pages/client/BlogPage.jsx';

const SEARCH_DELAY = 300;

class BlogController extends Component {
  componentDidMount() {
    this.load();
  }

  componentDidUpdate(prev) {
    const f = this.props.filters;
    const p = prev.filters;
    if (f.category !== p.category || f.page !== p.page) this.load();
    else if (f.q !== p.q) {
      // Recherche : on attend la fin de la frappe avant d'interroger l'API
      clearTimeout(this.timer);
      this.timer = setTimeout(this.load, SEARCH_DELAY);
    }
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  load = () => this.props.fetchArticles(this.props.filters);
  filter = (patch) => this.props.setArticleFilter(patch);
  goToPage = (page) => {
    this.props.setArticleFilter({ page });
    window.scrollTo(0, 0);
  };

  render() {
    const { items, filters, page, pages, categories, loading, error } = this.props;
    const cards = items.map((a, i) => ArticleService.toCard(a, i));
    // « À la une » : le plus récent, en première page et sans filtre
    const showFeatured = page === 1 && filters.category === 'all' && !filters.q.trim();
    const [featured, ...rest] = showFeatured ? cards : [null, ...cards];
    return (
      <BlogPage
        featured={featured}
        cards={rest}
        categories={categories}
        filters={filters}
        page={page}
        pages={pages}
        loading={loading}
        error={error}
        onFilter={this.filter}
        onPage={this.goToPage}
        onRetry={this.load}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.articles.items,
  filters: s.articles.filters,
  page: s.articles.page,
  pages: s.articles.pages,
  categories: s.articles.categories,
  loading: s.articles.loading,
  error: s.articles.error,
});
export default connect(mapState, { fetchArticles, setArticleFilter })(BlogController);
