import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchAwards, setActiveType } from '../store/slices/awardsSlice.js';
import { selectAwardGroups, selectVisibleAwardTotals } from '../store/selectors.js';
import AwardsPage from '../views/pages/client/AwardsPage.jsx';

class AwardsController extends Component {
  state = { selected: null };

  componentDidMount() {
    this.props.fetchAwards();
  }

  select = (selected) => this.setState({ selected });
  closeDetail = () => this.setState({ selected: null });

  render() {
    const p = this.props;
    return (
      <AwardsPage
        loading={p.loading}
        error={p.error}
        hasData={p.hasData}
        groups={p.groups}
        totals={p.totals}
        activeType={p.activeType}
        selected={this.state.selected}
        onTypeChange={p.setActiveType}
        onSelect={this.select}
        onCloseDetail={this.closeDetail}
      />
    );
  }
}

const mapState = (state) => ({
  groups: selectAwardGroups(state),
  totals: selectVisibleAwardTotals(state),
  activeType: state.awards.activeType,
  hasData: state.awards.items.length > 0,
  loading: state.awards.loading,
  error: state.awards.error,
});

export default connect(mapState, { fetchAwards, setActiveType })(AwardsController);
