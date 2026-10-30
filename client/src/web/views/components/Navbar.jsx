import { Component } from 'react';
import { NavLink } from 'react-router-dom';

export const NAV_LINKS = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/a-propos', label: 'À propos' },
  { to: '/projets', label: 'Projets' },
  { to: '/blog', label: 'Blog' },
  { to: '/formations', label: 'Formations' },
  { to: '/certifications', label: 'Certifications' },
  { to: '/distinctions', label: 'Distinctions' },
];

/** Barre de navigation collante ; sur mobile, menu plein écran (Échap pour fermer). */
export default class Navbar extends Component {
  state = { open: false };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKey);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKey);
    document.body.style.overflow = '';
  }

  handleKey = (e) => {
    if (e.key === 'Escape' && this.state.open) this.close();
  };

  toggle = () =>
    this.setState(
      (s) => ({ open: !s.open }),
      () => {
        document.body.style.overflow = this.state.open ? 'hidden' : '';
      }
    );

  close = () => {
    this.setState({ open: false });
    document.body.style.overflow = '';
  };

  dot(to) {
    if (!this.props.dots?.[to]) return null;
    return (
      <span className="pf-nav-dot">
        <span className="visually-hidden">nouveautés</span>
      </span>
    );
  }

  render() {
    const { initials = 'VN', dots = {}, muted, onToggleMuted } = this.props;
    const { open } = this.state;
    return (
      <header className="pf-nav">
        <nav className="pf-nav__bar" aria-label="Navigation principale">
          <NavLink
            to="/"
            exact
            className="pf-logo"
            aria-label="Accueil"
            onClick={this.close}
          >
            {initials}
            <i>.</i>
          </NavLink>
          <div className="pf-links">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} exact={l.exact} activeClassName="active">
                {l.label}
                {this.dot(l.to)}
              </NavLink>
            ))}
            <NavLink
              className="pf-btn pf-btn--pri"
              to="/contact"
              activeClassName="active"
            >
              Me contacter
            </NavLink>
          </div>
          {onToggleMuted ? (
            <button
              type="button"
              className="pf-sound"
              aria-pressed={!muted}
              aria-label={
                muted
                  ? 'Activer le son des notifications'
                  : 'Couper le son des notifications'
              }
              onClick={onToggleMuted}
            >
              <i
                className={`fa-solid ${muted ? 'fa-bell-slash' : 'fa-bell'}`}
                aria-hidden="true"
              />
            </button>
          ) : null}
          <button
            type="button"
            className="pf-burger"
            aria-expanded={open}
            aria-controls="pf-menu"
            onClick={this.toggle}
          >
            {open ? 'Fermer' : 'Menu'}
            {!open && Object.keys(dots).length ? (
              <span className="pf-nav-dot">
                <span className="visually-hidden">nouveautés</span>
              </span>
            ) : null}
          </button>
        </nav>
        {open ? (
          <div id="pf-menu" className="pf-menu" role="dialog" aria-label="Menu">
            <div className="pf-row pf-between" style={{ marginBottom: 24 }}>
              <span className="pf-logo">
                {initials}
                <i>.</i>
              </span>
              <button
                type="button"
                className="pf-burger"
                style={{ display: 'inline-flex' }}
                onClick={this.close}
              >
                Fermer
              </button>
            </div>
            {[...NAV_LINKS, { to: '/contact', label: 'Contact' }].map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                exact={l.exact}
                activeClassName="active"
                onClick={this.close}
              >
                <span>
                  {l.label}
                  {this.dot(l.to)}
                </span>
                <span aria-hidden="true">→</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </header>
    );
  }
}
