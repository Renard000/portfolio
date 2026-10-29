import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchSeriesList, setSeriesFilter } from '../store/slices/videosSlice.js';
import FormationsPage from '../views/pages/client/FormationsPage.jsx';

class FormationsController extends Component {
  searchTimer = null;

  componentDidMount() {
    this.props.fetchSeriesList();
  }

  componentWillUnmount() {
    clearTimeout(this.searchTimer);
  }

  /** Les filtres vont au serveur ; la recherche texte est retardée (pas une requête par lettre). */
  filter = (patch) => {
    this.props.setSeriesFilter(patch);
    clearTimeout(this.searchTimer);
    if ('q' in patch)
      this.searchTimer = setTimeout(() => this.props.fetchSeriesList(), 300);
    else this.props.fetchSeriesList();
  };

  render() {
    const p = this.props;
    return (
      <FormationsPage
        items={p.items}
        total={p.total}
        categories={p.categories}
        filters={p.filters}
        loading={p.loading}
        error={p.error}
        onFilter={this.filter}
      />
    );
  }
}

const mapState = (s) => ({
  items: s.videos.list.items,
  total: s.videos.list.total,
  categories: s.videos.list.categories,
  filters: s.videos.filters,
  loading: s.videos.list.loading,
  error: s.videos.list.error,
});
export default connect(mapState, { fetchSeriesList, setSeriesFilter })(
  FormationsController
);
