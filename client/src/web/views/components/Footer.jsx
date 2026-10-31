import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { safeHref } from '../../utils/url.js';
import withLocale from '../../context/withLocale.jsx';

class Footer extends PureComponent {
  render() {
    const { profile } = this.props;
    const name = profile ? profile.name : '';
    const github = profile && safeHref(profile.links.github);
    const linkedin = profile && safeHref(profile.links.linkedin);
    return (
      <footer className="pf-wrap" style={{ padding: '120px clamp(20px,4vw,48px) 48px' }}>
        <div
          className="pf-grid4"
          style={{ borderTop: '1px solid var(--pf-line)', paddingTop: 48 }}
        >
          <div className="pf-col">
            <span className="pf-logo">
              {profile ? profile.initials : 'VN'}
              <i>.</i>
            </span>
            <span className="pf-mu">
              {profile ? `${profile.role[0].toUpperCase()}${profile.role.slice(1)}.` : ''}
              <br />
              {profile ? profile.city : ''}
            </span>
          </div>
          <div className="pf-col">
            <span className="pf-mono">{this.props.t('Explorer')}</span>
            <Link to="/projets">{this.props.t('Projets')}</Link>
            <Link to="/blog">{this.props.t('Blog')}</Link>
            <Link to="/formations">{this.props.t('Formations')}</Link>
            <Link to="/a-propos">{this.props.t('À propos')}</Link>
            <Link to="/contact">{this.props.t('Contact')}</Link>
          </div>
          <div className="pf-col">
            <span className="pf-mono">{this.props.t('Parcours')}</span>
            <Link to="/certifications">{this.props.t('Certifications')}</Link>
            <Link to="/distinctions">{this.props.t('Distinctions')}</Link>
            {github ? (
              <a href={github} target="_blank" rel="noopener noreferrer">
                {this.props.t('GitHub')}
              </a>
            ) : null}
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                {this.props.t('LinkedIn')}
              </a>
            ) : null}
          </div>
          <div className="pf-col">
            <span className="pf-mono">{this.props.t('Site')}</span>
            <span className="pf-mu">
              © {new Date().getFullYear()} {name}
              {this.props.t('. Tous droits réservés.')}
            </span>
            <Link to="/conditions">{this.props.t('Conditions d’utilisation')}</Link>
            <Link to="/confidentialite">{this.props.t('Confidentialité')}</Link>
            <Link to="/admin" className="pf-mu" style={{ fontSize: 13 }}>
              {this.props.t('Espace administrateur')}
            </Link>
          </div>
        </div>
      </footer>
    );
  }
}

export default withLocale(Footer);
