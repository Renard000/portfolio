import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchCertifications } from '../store/slices/certificationsSlice.js';
import { fetchAwards } from '../store/slices/awardsSlice.js';
import { fetchLatestSeries } from '../store/slices/videosSlice.js';
import { fetchLatestArticles } from '../store/slices/articlesSlice.js';
import { subscribeNewsletter, enablePush } from '../store/slices/newsletterSlice.js';
import {
  selectFeaturedCertifications,
  selectFeaturedProjects,
  selectRecentArticleCards,
  selectRecentAwards,
  selectRecentCertifications,
  selectRecentProjects,
} from '../store/selectors.js';
import HomePage from '../views/pages/client/HomePage.jsx';

class HomeController extends Component {
  state = { selected: null };

  componentDidMount() {
    this.props.fetchCertifications();
    this.props.fetchLatestSeries();
    this.props.fetchLatestArticles();
  }

  // Le render prop DataFetcher de l'accueil appelle cette fonction (promesse des données).
  loadAwards = () => this.props.fetchAwards().unwrap();
  select = (selected) => this.setState({ selected });
  closeDetail = () => this.setState({ selected: null });

  render() {
    const p = this.props;
    return (
      <HomePage
        profile={p.profile}
        projects={p.projects}
        featured={p.featured}
        latestSeries={p.latestSeries}
        recentProjects={p.recentProjects}
        recentArticles={p.recentArticles}
        recentCertifications={p.recentCertifications}
        recentAwards={p.recentAwards}
        stats={p.stats}
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
  profile: state.content.profile,
  projects: selectFeaturedProjects(state),
  featured: selectFeaturedCertifications(state),
  latestSeries: state.videos.latest,
  recentProjects: selectRecentProjects(state),
  recentArticles: selectRecentArticleCards(state),
  recentCertifications: selectRecentCertifications(state),
  recentAwards: selectRecentAwards(state),
  stats: {
    projects: state.content.projects.length,
    certifications: state.certifications.items.length,
    distinctions: state.awards.totals.count,
    technologies: state.content.profile.tech.length,
  },
  newsletterStatus: state.newsletter.status,
  newsletterError: state.newsletter.error,
  pushStatus: state.newsletter.push,
});

export default connect(mapState, {
  fetchCertifications,
  fetchLatestSeries,
  fetchLatestArticles,
  fetchAwards,
  subscribeNewsletter,
  enablePush,
})(HomeController);
