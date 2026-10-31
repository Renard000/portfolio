import { Component } from 'react';
import { NavLink } from 'react-router-dom';
import withLocale from '../../context/withLocale.jsx';

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
class Navbar extends Component {
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
        <span className="visually-hidden">{this.props.t('nouveautés')}</span>
      </span>
    );
  }

  render() {
    const {
      initials = 'VN',
      dots = {},
      muted,
      onToggleMuted,
      lang,
      onToggleLanguage,
    } = this.props;
    const { open } = this.state;
    return (
      <header className="pf-nav">
        <nav className="pf-nav__bar" aria-label={this.props.t('Navigation principale')}>
          <NavLink
            to="/"
            exact
            className="pf-logo"
            aria-label={this.props.t('Accueil')}
            onClick={this.close}
          >
            {initials}
            <i>.</i>
          </NavLink>
          <div className="pf-links">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} exact={l.exact} activeClassName="active">
                {this.props.t(l.label)}
                {this.dot(l.to)}
              </NavLink>
            ))}
            <NavLink
              className="pf-btn pf-btn--pri"
              to="/contact"
              activeClassName="active"
            >
              {this.props.t('Me contacter')}
            </NavLink>
          </div>
          {onToggleLanguage ? (
            <button
              type="button"
              className="pf-sound"
              lang={lang === 'fr' ? 'en' : 'fr'}
              aria-label={this.props.t(
                lang === 'fr' ? 'Passer le site en anglais' : 'Passer le site en français'
              )}
              onClick={onToggleLanguage}
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
          ) : null}
          {onToggleMuted ? (
            <button
              type="button"
              className="pf-sound"
              aria-pressed={!muted}
              aria-label={
                muted
                  ? this.props.t('Activer le son des notifications')
                  : this.props.t('Couper le son des notifications')
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
            {open ? this.props.t('Fermer') : this.props.t('Menu')}
            {!open && Object.keys(dots).length ? (
              <span className="pf-nav-dot">
                <span className="visually-hidden">{this.props.t('nouveautés')}</span>
              </span>
            ) : null}
          </button>
        </nav>
        {open ? (
          <div
            id="pf-menu"
            className="pf-menu"
            role="dialog"
            aria-label={this.props.t('Menu')}
          >
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
                {this.props.t('Fermer')}
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
                  {this.props.t(l.label)}
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

export default withLocale(Navbar);
