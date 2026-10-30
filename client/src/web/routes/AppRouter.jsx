import { Component, Suspense, lazy } from 'react';
import { Switch, Route } from 'react-router-dom';

import withContentProtection from '../views/components/withContentProtection.jsx';
import LayoutController from '../controllers/LayoutController.jsx';

// Chargement différé des pages et contrôleurs.
const NotFoundPage = lazy(() => import('../views/pages/client/NotFoundPage.jsx'));

const HomeController = lazy(() => import('../controllers/HomeController.jsx'));

const AboutController = lazy(() => import('../controllers/AboutController.jsx'));

const ProjectsController = lazy(() => import('../controllers/ProjectsController.jsx'));

const ProjectDetailController = lazy(
  () => import('../controllers/ProjectDetailController.jsx')
);

const FormationsController = lazy(
  () => import('../controllers/FormationsController.jsx')
);

const SeriesController = lazy(() => import('../controllers/SeriesController.jsx'));

const VideoPlayerController = lazy(
  () => import('../controllers/VideoPlayerController.jsx')
);

const LegalController = lazy(() => import('../controllers/LegalController.jsx'));

const ContactController = lazy(() => import('../controllers/ContactController.jsx'));

const CertificationsController = lazy(
  () => import('../controllers/CertificationsController.jsx')
);

const AwardsController = lazy(() => import('../controllers/AwardsController.jsx'));

const BlogController = lazy(() => import('../controllers/BlogController.jsx'));

const ArticleDetailController = lazy(
  () => import('../controllers/ArticleDetailController.jsx')
);

const NewsletterStatusController = lazy(
  () => import('../controllers/NewsletterStatusController.jsx')
);

const LoginController = lazy(() => import('../controllers/LoginController.jsx'));

const AdminAreaController = lazy(() => import('../controllers/AdminAreaController.jsx'));

// Protection du contenu : composants créés une seule fois.
// Ne pas appeler withContentProtection() dans render().
const Home = withContentProtection(HomeController);
const About = withContentProtection(AboutController);
const Projects = withContentProtection(ProjectsController);
const ProjectDetail = withContentProtection(ProjectDetailController);
const Formations = withContentProtection(FormationsController);
const Series = withContentProtection(SeriesController);
const Player = withContentProtection(VideoPlayerController);
const Certifications = withContentProtection(CertificationsController);
const Awards = withContentProtection(AwardsController);
const Blog = withContentProtection(BlogController);
const ArticleDetail = withContentProtection(ArticleDetailController);

// Pages légales : wrappers compatibles avec React.lazy
// et le chargement du paramètre kind.
const Conditions = () => <LegalController kind="conditions" />;

const Privacy = () => <LegalController kind="confidentialite" />;

// Pages d'arrivée des liens des courriels de la newsletter
const NewsletterConfirm = () => <NewsletterStatusController kind="confirm" />;
const NewsletterUnsubscribe = () => <NewsletterStatusController kind="unsubscribe" />;

export default class AppRouter extends Component {
  render() {
    return (
      <LayoutController>
        <Suspense
          fallback={
            <div className="container py-5" role="status" aria-live="polite">
              Chargement...
            </div>
          }
        >
          <Switch>
            <Route exact path="/" component={Home} />

            <Route exact path="/a-propos" component={About} />

            <Route exact path="/projets" component={Projects} />

            <Route exact path="/projets/:slug" component={ProjectDetail} />

            <Route exact path="/blog" component={Blog} />

            <Route exact path="/blog/:slug" component={ArticleDetail} />

            <Route exact path="/newsletter/confirmation" component={NewsletterConfirm} />

            <Route
              exact
              path="/newsletter/desinscription"
              component={NewsletterUnsubscribe}
            />

            {/* Les routes les plus spécifiques en premier. */}
            <Route exact path="/formations/:seriesSlug/:videoSlug" component={Player} />

            <Route exact path="/formations/:seriesSlug" component={Series} />

            <Route exact path="/formations" component={Formations} />

            <Route exact path="/contact" component={ContactController} />

            <Route exact path="/conditions" component={Conditions} />

            <Route exact path="/confidentialite" component={Privacy} />

            <Route exact path="/certifications" component={Certifications} />

            <Route exact path="/distinctions" component={Awards} />

            {/* La connexion doit précéder la route /admin. */}
            <Route exact path="/admin/login" component={LoginController} />

            <Route path="/admin" component={AdminAreaController} />

            {/* La page 404 doit toujours rester en dernier. */}
            <Route component={NotFoundPage} />
          </Switch>
        </Suspense>
      </LayoutController>
    );
  }
}
