import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Navbar from '../views/components/Navbar.jsx';
import Footer from '../views/components/Footer.jsx';
import PageMeta from '../views/components/PageMeta.jsx';
import ToastStack from '../views/components/ToastStack.jsx';
import NewItemsContext from '../context/NewItemsContext.js';
import { metaForPath } from '../../domain/content/seoContent.js';
import FeedService from '../../bll/services/FeedService.js';
import { loadContent } from '../store/slices/contentSlice.js';
import {
  alertUser,
  fetchFeed,
  markPublicationSeen,
  subscribeFeed,
  toastDismissed,
  toggleMuted,
  visitPath,
} from '../store/slices/feedSlice.js';
import { selectFeedIndex } from '../store/selectors.js';

const isAdmin = (location) => location.pathname.startsWith('/admin');

/** Gabarit commun : navigation, contenu de la route, pied de page ; remonte en haut à chaque page. */
class LayoutController extends Component {
  componentDidMount() {
    // Projets et compétences gérés depuis l'admin (le fichier local reste affiché d'ici là)
    this.props.loadContent();
    this.props.fetchFeed();
    this.stopFeed = this.props.subscribeFeed(this.onPublication);
  }

  componentDidUpdate(prevProps) {
    const { location, items, visitPath: visit } = this.props;
    const moved = prevProps.location.pathname !== location.pathname;
    if (moved) window.scrollTo(0, 0);
    // Aussi quand le fil change : une page ouverte avant son arrivée compte comme vue
    if (moved || prevProps.items !== items) visit(location.pathname);
  }

  componentWillUnmount() {
    if (this.stopFeed) this.stopFeed();
  }

  onPublication = (item) => {
    if (!isAdmin(this.props.location)) this.props.alertUser(FeedService.toToast(item));
  };

  /** Valeur du contexte : recalculée seulement si l'index des nouveautés change. */
  contextValue() {
    const { index, markPublicationSeen: markSeen } = this.props;
    if (this.lastIndex !== index) {
      this.lastIndex = index;
      this.lastValue = { isNew: (q) => FeedService.isNew(index, q), markSeen };
    }
    return this.lastValue;
  }

  render() {
    const { profile, children, location, index, muted, toasts } = this.props;
    const meta = metaForPath(location.pathname);
    // L'administration a sa propre mise en page (barre latérale, maquettes A-01 à A-08)
    if (isAdmin(location))
      return (
        <>
          <PageMeta {...meta} />
          {children}
          <ToastStack toasts={toasts} onDismiss={this.props.toastDismissed} />
        </>
      );
    return (
      <NewItemsContext.Provider value={this.contextValue()}>
        <PageMeta {...meta} />
        <a
          href="#contenu"
          className="visually-hidden-focusable pf-btn pf-btn--pri"
          style={{ position: 'absolute', left: 8, top: 8, zIndex: 100 }}
        >
          Aller au contenu
        </a>
        <Navbar
          initials={profile ? profile.initials : 'VN'}
          dots={index.dots}
          muted={muted}
          onToggleMuted={this.props.toggleMuted}
        />
        <div id="contenu">{children}</div>
        <Footer profile={profile} />
        <ToastStack toasts={toasts} onDismiss={this.props.toastDismissed} />
      </NewItemsContext.Provider>
    );
  }
}

const mapState = (state) => ({
  profile: state.content.profile,
  items: state.feed.items,
  index: selectFeedIndex(state),
  muted: state.feed.seen.muted,
  toasts: state.feed.toasts,
});
export default withRouter(
  connect(mapState, {
    loadContent,
    fetchFeed,
    subscribeFeed,
    alertUser,
    visitPath,
    markPublicationSeen,
    toggleMuted,
    toastDismissed,
  })(LayoutController)
);
