import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Navbar from '../views/components/Navbar.jsx';
import Footer from '../views/components/Footer.jsx';

/** Gabarit commun : navigation, contenu de la route, pied de page ; remonte en haut à chaque page. */
class LayoutController extends Component {
  componentDidUpdate(prevProps) {
    if (prevProps.location.pathname !== this.props.location.pathname)
      window.scrollTo(0, 0);
  }

  render() {
    const { profile, children } = this.props;
    return (
      <>
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
export default withRouter(connect(mapState)(LayoutController));
