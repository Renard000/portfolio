import { Component, Suspense, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';

import LayoutController from '../controllers/LayoutController.jsx';

// Chargement différé des pages et contrôleurs.
const NotFoundPage = lazy(() =>
  import('../views/pages/client/NotFoundPage.jsx')
);

const HomeController = lazy(() =>
  import('../controllers/HomeController.jsx')
);

const AboutController = lazy(() =>
  import('../controllers/AboutController.jsx')
);

const ProjectsController = lazy(() =>
  import('../controllers/ProjectsController.jsx')
);

const ProjectDetailController = lazy(() =>
  import('../controllers/ProjectDetailController.jsx')
);

const ContactController = lazy(() =>
  import('../controllers/ContactController.jsx')
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
      <LayoutController>
        <Suspense
          fallback={
            <div className="container py-5" role="status">
              Chargement...
            </div>
          }
        >
          <Switch>
            <Route
              exact
              path="/"
              component={HomeController}
            />

            <Route
              exact
              path="/a-propos"
              component={AboutController}
            />

            <Route
              exact
              path="/projets"
              component={ProjectsController}
            />

            <Route
              exact
              path="/projets/:slug"
              component={ProjectDetailController}
            />

            <Route
              exact
              path="/contact"
              component={ContactController}
            />

            <Route
              exact
              path="/certifications"
              component={CertificationsController}
            />

            <Route
              exact
              path="/distinctions"
              component={AwardsController}
            />

            {/* La connexion doit précéder la route /admin. */}
            <Route
              exact
              path="/admin/login"
              component={LoginController}
            />

            <Route
              path="/admin"
              component={AdminAreaController}
            />

            {/* La page 404 doit toujours rester en dernier. */}
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>
      </LayoutController>
    );
  }
}