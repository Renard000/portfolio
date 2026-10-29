import { Component } from 'react';
import { NavLink } from 'react-router-dom';

export const NAV_LINKS = [
  { to: '/', label: 'Accueil', exact: true },
  { to: '/a-propos', label: 'À propos' },
  { to: '/projets', label: 'Projets' },
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

  render() {
    const { initials = 'VN' } = this.props;
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
          <button
            type="button"
            className="pf-burger"
            aria-expanded={open}
            aria-controls="pf-menu"
            onClick={this.toggle}
          >
            {open ? 'Fermer' : 'Menu'}
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
                <span>{l.label}</span>
                <span aria-hidden="true">→</span>
              </NavLink>
            ))}
          </div>
        ) : null}
      </header>
    );
  }
}
