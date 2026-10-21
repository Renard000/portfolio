
import { Component, Suspense, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';

import Navbar from '../views/components/Navbar.jsx';

// Chargement différé des pages et contrôleurs.
const NotFoundPage = lazy(() =>
  import('../views/pages/client/NotFoundPage.jsx')
);

const HomeController = lazy(() =>
  import('../controllers/HomeController.jsx')
);

const CertificationsController = lazy(() =>
  import('../controllers/CertificationsController.jsx')
);

const AwardsController = lazy(() =>
  import('../controllers/AwardsController.jsx')
);

const LoginController = lazy(() =>
  import('../controllers/LoginController.jsx')
);

const AdminAreaController = lazy(() =>
  import('../controllers/AdminAreaController.jsx')
);

export default class AppRouter extends Component {
  render() {
    return (
      <>
        <Navbar />

        <Suspense fallback={<div className="container py-5">Chargement...</div>}>
          <Switch>
            <Route exact path="/" component={HomeController} />

            <Route
              path="/certifications"
              component={CertificationsController}
            />

            <Route
              path="/distinctions"
              component={AwardsController}
            />

            {/* La connexion doit précéder la route /admin. */}
            <Route
              path="/admin/login"
              component={LoginController}
            />

            <Route
              path="/admin"
              component={AdminAreaController}
            />

            {/* Toujours en dernier. */}
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>
      </>
    );
  }
}
