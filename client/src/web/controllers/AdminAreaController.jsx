import { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import { restoreSession, signOut } from '../store/slices/authSlice.js';
import { fetchComments, fetchMessages } from '../store/slices/moderationSlice.js';
import { selectAdminBadges } from '../store/selectors.js';
import AdminLayout from '../views/components/AdminLayout.jsx';
import AdminDashboardController from './AdminDashboardController.jsx';
import AdminProjectsController from './AdminProjectsController.jsx';
import AdminSkillsController from './AdminSkillsController.jsx';
import AdminArticlesController from './AdminArticlesController.jsx';
import ArticleEditorController from './ArticleEditorController.jsx';
import ModerationController from './ModerationController.jsx';
import AdminCertificationsController from './AdminCertificationsController.jsx';
import AdminAwardsController from './AdminAwardsController.jsx';
import AdminFormationsController from './AdminFormationsController.jsx';
import AdminSeriesController from './AdminSeriesController.jsx';
import AdminSubscribersController from './AdminSubscribersController.jsx';

/** Garde de la zone /admin : session requise, sinon redirection vers la connexion. */
class AdminAreaController extends Component {
  componentDidMount() {
    if (!this.props.ready) this.props.restoreSession();
    else this.loadBadges();
  }

  componentDidUpdate(prev) {
    if (!prev.user && this.props.user) this.loadBadges();
  }

  /** Pastilles « Commentaires » et « Messages » de la barre latérale. */
  loadBadges() {
    if (!this.props.user || this.props.moderationLoaded) return;
    this.props.fetchComments();
    this.props.fetchMessages();
  }

  render() {
    const { ready, user, badges, signOut: onSignOut } = this.props;
    if (!ready)
      return (
        <p className="container py-5 text-muted" role="status">
          Chargement…
        </p>
      );
    if (!user) return <Redirect to="/admin/login" />;
    return (
      <AdminLayout
        email={user.email}
        initials={this.props.initials}
        onSignOut={onSignOut}
        badges={badges}
      >
        <Switch>
          <Route exact path="/admin" component={AdminDashboardController} />
          <Route path="/admin/projets" component={AdminProjectsController} />
          <Route path="/admin/competences" component={AdminSkillsController} />
          <Route exact path="/admin/articles" component={AdminArticlesController} />
          <Route path="/admin/articles/:id" component={ArticleEditorController} />
          <Route path="/admin/commentaires" component={ModerationController} />
          <Route path="/admin/messages" component={ModerationController} />
          <Route path="/admin/certifications" component={AdminCertificationsController} />
          <Route
            path={['/admin/distinctions', '/admin/awards']}
            component={AdminAwardsController}
          />
          <Route exact path="/admin/formations" component={AdminFormationsController} />
          <Route path="/admin/formations/:id" component={AdminSeriesController} />
          <Route
            path={['/admin/abonnes', '/admin/subscribers']}
            component={AdminSubscribersController}
          />
          <Redirect to="/admin" />
        </Switch>
      </AdminLayout>
    );
  }
}

const mapState = (state) => ({
  ready: state.auth.ready,
  user: state.auth.user,
  initials: state.content.profile.initials,
  moderationLoaded: state.moderation.loaded,
  badges: selectAdminBadges(state),
});
export default connect(mapState, {
  restoreSession,
  signOut,
  fetchComments,
  fetchMessages,
})(AdminAreaController);
