import { Component } from 'react';
import { connect } from 'react-redux';
import {
  fetchCertifications,
  setFilter,
  resetFilters,
  setView,
} from '../store/slices/certificationsSlice.js';
import {
  selectVisibleCertifications,
  selectCertificationFacets,
} from '../store/selectors.js';
import CertificationsPage from '../views/pages/client/CertificationsPage.jsx';

class CertificationsController extends Component {
  state = { selected: null };

  componentDidMount() {
    this.props.fetchCertifications();
  }

  select = (selected) => this.setState({ selected });
  closeDetail = () => this.setState({ selected: null });

  render() {
    const p = this.props;
    return (
      <CertificationsPage
        loading={p.loading}
        error={p.error}
        hasData={p.totalCount > 0}
        items={p.items}
        totalCount={p.totalCount}
        filters={p.filters}
        facets={p.facets}
        view={p.view}
        selected={this.state.selected}
        onFilterChange={p.setFilter}
        onReset={() => p.resetFilters()}
        onViewChange={p.setView}
        onSelect={this.select}
        onCloseDetail={this.closeDetail}
      />
    );
  }
}

const mapState = (state) => ({
  items: selectVisibleCertifications(state),
  facets: selectCertificationFacets(state),
  totalCount: state.certifications.items.length,
  filters: state.certifications.filters,
  view: state.certifications.view,
  loading: state.certifications.loading,
  error: state.certifications.error,
});

export default connect(mapState, {
  fetchCertifications,
  setFilter,
  resetFilters,
  setView,
})(CertificationsController);
