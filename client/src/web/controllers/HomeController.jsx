import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchCertifications } from '../store/slices/certificationsSlice.js';
import { fetchAwards } from '../store/slices/awardsSlice.js';
import { subscribeNewsletter, enablePush } from '../store/slices/newsletterSlice.js';
import { selectFeaturedCertifications } from '../store/selectors.js';
import HomePage from '../views/pages/client/HomePage.jsx';

class HomeController extends Component {
  state = { selected: null };

  componentDidMount() {
    this.props.fetchCertifications();
  }

  // Le render prop DataFetcher de l'accueil appelle cette fonction (promesse des données).
  loadAwards = () => this.props.fetchAwards().unwrap();
  select = (selected) => this.setState({ selected });
  closeDetail = () => this.setState({ selected: null });

  render() {
    const p = this.props;
    return (
      <HomePage
        featured={p.featured}
        loadAwards={this.loadAwards}
        selected={this.state.selected}
        onSelect={this.select}
        onCloseDetail={this.closeDetail}
        newsletterStatus={p.newsletterStatus}
        newsletterError={p.newsletterError}
        onSubscribe={p.subscribeNewsletter}
        pushStatus={p.pushStatus}
        onEnablePush={p.enablePush}
      />
    );
  }
}

const mapState = (state) => ({
  featured: selectFeaturedCertifications(state),
  newsletterStatus: state.newsletter.status,
  newsletterError: state.newsletter.error,
  pushStatus: state.newsletter.push,
});

export default connect(mapState, {
  fetchCertifications,
  fetchAwards,
  subscribeNewsletter,
  enablePush,
})(HomeController);
