import { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { newsletterPages } from '../../domain/content/newsletterContent.js';
import NewsletterStatusPage from '../views/pages/client/NewsletterStatusPage.jsx';

/**
 * Page d'arrivée des liens des courriels. `kind` (confirm | unsubscribe) vient du Route,
 * le statut (?statut=ok|invalide) de la redirection du serveur. Toute autre valeur = invalide.
 */
class NewsletterStatusController extends Component {
  render() {
    const statut = new URLSearchParams(this.props.location.search).get('statut');
    const pages = newsletterPages[this.props.kind];
    return <NewsletterStatusPage page={statut === 'ok' ? pages.ok : pages.invalide} />;
  }
}

export default withRouter(NewsletterStatusController);
