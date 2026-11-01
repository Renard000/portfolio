import { Component } from 'react';
import { NavLink } from 'react-router-dom';

/** Entrées de la barre latérale (maquettes A-02 à A-08). `badges` : clés des compteurs. */
export const ADMIN_LINKS = [
  { to: '/admin', label: 'Tableau de bord', exact: true },
  { to: '/admin/projets', label: 'Projets' },
  { to: '/admin/articles', label: 'Articles' },
  {
    to: '/admin/messages',
    label: 'Modération',
    also: '/admin/commentaires',
    badges: ['comments', 'messages'],
  },
  { to: '/admin/courriels', label: 'Courriels' },
  { to: '/admin/competences', label: 'Compétences' },
  { to: '/admin/certifications', label: 'Certifications' },
  { to: '/admin/distinctions', label: 'Distinctions', also: '/admin/awards' },
  { to: '/admin/formations', label: 'Formations' },
  { to: '/admin/abonnes', label: 'Abonnés', also: '/admin/subscribers' },
];

/** Barre latérale sur PC ; sur mobile, barre du haut avec menu déroulant. */
export default class AdminLayout extends Component {
  state = { open: false };

  toggle = () => this.setState((s) => ({ open: !s.open }));

  close = () => this.setState({ open: false });

  count(link) {
    const { badges } = this.props;
    if (!link.badges || !badges) return 0;
    return link.badges.reduce((sum, key) => sum + (badges[key] || 0), 0);
  }

  render() {
    const { email, initials, onSignOut, children } = this.props;
    const { open } = this.state;
    return (
      <div className="pf-admin">
        <aside className="pf-sb" aria-label="Administration">
          <div className="pf-sb__top">
            <span className="pf-logo">
              {initials}
              <i>.</i>{' '}
              <span className="pf-mono" style={{ color: 'var(--pf-vio)' }}>
                admin
              </span>
            </span>
            <button
              type="button"
              className="pf-burger"
              aria-expanded={open}
              aria-controls="pf-sb-menu"
              onClick={this.toggle}
            >
              {open ? 'Fermer' : 'Menu'}
            </button>
          </div>
          <div id="pf-sb-menu" className={`pf-sb__menu${open ? ' is-open' : ''}`}>
            <nav
              className="pf-col"
              style={{ gap: 4 }}
              aria-label="Sections de l’administration"
            >
              {ADMIN_LINKS.map((l) => {
                const count = this.count(l);
                return (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    exact={l.exact}
                    className="pf-sb__link"
                    activeClassName="active"
                    onClick={this.close}
                    isActive={(match, location) =>
                      Boolean(match) ||
                      Boolean(l.also && location.pathname.startsWith(l.also))
                    }
                  >
                    <span>{l.label}</span>
                    {count ? (
                      <span className="pf-bd" aria-label={`${count} à traiter`}>
                        {count}
                      </span>
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
            <div className="pf-sb__foot">
              {email}
              <br />
              <button type="button" className="pf-link-btn" onClick={onSignOut}>
                Déconnexion
              </button>
            </div>
          </div>
        </aside>
        <main className="pf-admin__main" id="contenu">
          {children}
        </main>
      </div>
    );
  }
}
