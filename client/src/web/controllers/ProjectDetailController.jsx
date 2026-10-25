import { Component } from 'react';
import { connect } from 'react-redux';
import ContentService from '../../bll/services/ContentService.js';
import ProjectDetailPage from '../views/pages/client/ProjectDetailPage.jsx';

class ProjectDetailController extends Component {
  componentDidUpdate(prev) {
    if (prev.slug !== this.props.slug) window.scrollTo(0, 0);
  }

  render() {
    const { projects, slug } = this.props;
    return (
      <ProjectDetailPage
        project={ContentService.findBySlug(projects, slug)}
        next={ContentService.next(projects, slug)}
      />
    );
  }
}

// Le slug vient de l'URL (/projets/:slug) fournie par le Route.
const mapState = (state, own) => ({
  projects: state.content.projects,
  slug: own.match.params.slug,
});
export default connect(mapState)(ProjectDetailController);
