import { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';
import { restoreSession, signOut } from '../store/slices/authSlice.js';
import AdminLayout from '../views/components/AdminLayout.jsx';
import AdminCertificationsController from './AdminCertificationsController.jsx';
import AdminAwardsController from './AdminAwardsController.jsx';
import AdminFormationsController from './AdminFormationsController.jsx';
import AdminSeriesController from './AdminSeriesController.jsx';
import AdminSubscribersController from './AdminSubscribersController.jsx';

/** Garde de la zone /admin : session requise, sinon redirection vers la connexion. */
class AdminAreaController extends Component {
  componentDidMount() {
    if (!this.props.ready) this.props.restoreSession();
  }

  render() {
    const { ready, user, signOut: onSignOut } = this.props;
    if (!ready)
      return (
        <p className="container py-5 text-muted" role="status">
          Chargement…
        </p>
      );
    if (!user) return <Redirect to="/admin/login" />;
    return (
      <AdminLayout email={user.email} onSignOut={onSignOut}>
        <Switch>
          <Route path="/admin/certifications" component={AdminCertificationsController} />
          <Route path="/admin/awards" component={AdminAwardsController} />
          <Route exact path="/admin/formations" component={AdminFormationsController} />
          <Route path="/admin/formations/:id" component={AdminSeriesController} />
          <Route path="/admin/subscribers" component={AdminSubscribersController} />
          <Redirect to="/admin/certifications" />
        </Switch>
      </AdminLayout>
    );
  }
}

const mapState = (state) => ({ ready: state.auth.ready, user: state.auth.user });
export default connect(mapState, { restoreSession, signOut })(AdminAreaController);
