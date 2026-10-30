import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Navbar from '../views/components/Navbar.jsx';
import Footer from '../views/components/Footer.jsx';
import PageMeta from '../views/components/PageMeta.jsx';
import { metaForPath } from '../../domain/content/seoContent.js';
import { loadContent } from '../store/slices/contentSlice.js';

/** Gabarit commun : navigation, contenu de la route, pied de page ; remonte en haut à chaque page. */
class LayoutController extends Component {
  componentDidMount() {
    // Projets et compétences gérés depuis l'admin (le fichier local reste affiché d'ici là)
    this.props.loadContent();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname)
      window.scrollTo(0, 0);
  }

  render() {
    const { profile, children, location } = this.props;
    // L'administration a sa propre mise en page (barre latérale, maquettes A-01 à A-08)
    const meta = metaForPath(location.pathname);
    if (location.pathname.startsWith('/admin'))
      return (
        <>
          <PageMeta {...meta} />
          {children}
        </>
      );
    return (
      <>
        <PageMeta {...meta} />
        <a
          href="#contenu"
          className="visually-hidden-focusable pf-btn pf-btn--pri"
          style={{ position: 'absolute', left: 8, top: 8, zIndex: 100 }}
        >
          Aller au contenu
        </a>
        <Navbar initials={profile ? profile.initials : 'VN'} />
        <div id="contenu">{children}</div>
        <Footer profile={profile} />
      </>
    );
  }
}

const mapState = (state) => ({ profile: state.content.profile });
export default withRouter(connect(mapState, { loadContent })(LayoutController));
