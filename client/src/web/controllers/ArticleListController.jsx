import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchArticles } from '../store/slices/articlesSlice.js';
import ArticleListView from '../views/components/ArticleListView.jsx';

class ArticleListController extends Component {
  componentDidMount() {
    this.props.fetchArticles({ page: 1 });
  }

  render() {
    const { items, loading, error } = this.props;
    return <ArticleListView items={items} loading={loading} error={error} />;
  }
}

const mapState = (state) => ({
  items: state.articles.items,
  loading: state.articles.loading,
  error: state.articles.error,
});

export default connect(mapState, { fetchArticles })(ArticleListController);
