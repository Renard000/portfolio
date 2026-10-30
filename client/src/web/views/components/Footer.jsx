import { PureComponent } from 'react';
import { Link } from 'react-router-dom';
import { safeHref } from '../../utils/url.js';

export default class Footer extends PureComponent {
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
            <span className="pf-mono">Explorer</span>
            <Link to="/projets">Projets</Link>
            <Link to="/blog">Blog</Link>
            <Link to="/formations">Formations</Link>
            <Link to="/a-propos">À propos</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="pf-col">
            <span className="pf-mono">Parcours</span>
            <Link to="/certifications">Certifications</Link>
            <Link to="/distinctions">Distinctions</Link>
            {github ? (
              <a href={github} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            ) : null}
            {linkedin ? (
              <a href={linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            ) : null}
          </div>
          <div className="pf-col">
            <span className="pf-mono">Site</span>
            <span className="pf-mu">
              © {new Date().getFullYear()} {name}. Tous droits réservés.
            </span>
            <Link to="/conditions">Conditions d’utilisation</Link>
            <Link to="/confidentialite">Confidentialité</Link>
            <Link to="/admin" className="pf-mu" style={{ fontSize: 13 }}>
              Espace administrateur
            </Link>
          </div>
        </div>
      </footer>
    );
  }
}
