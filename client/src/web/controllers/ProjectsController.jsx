import { Component } from 'react';
import { connect } from 'react-redux';
import { setProjectFilter } from '../store/slices/contentSlice.js';
import { selectVisibleProjects, selectProjectCategories } from '../store/selectors.js';
import ProjectsPage from '../views/pages/client/ProjectsPage.jsx';

class ProjectsController extends Component {
  render() {
    const p = this.props;
    return (
      <ProjectsPage
        projects={p.projects}
        total={p.total}
        categories={p.categories}
        filters={p.filters}
        onFilter={p.setProjectFilter}
      />
    );
  }
}

const mapState = (state) => ({
  projects: selectVisibleProjects(state),
  categories: selectProjectCategories(state),
  total: state.content.projects.length,
  filters: state.content.filters,
});
export default connect(mapState, { setProjectFilter })(ProjectsController);
