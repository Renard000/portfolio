import { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

/** Entrées de la barre latérale (maquettes A-02 à A-08). `badge` : clé des compteurs. */
export const ADMIN_LINKS = [
  { to: '/admin', label: 'Tableau de bord', exact: true },
  { to: '/admin/projets', label: 'Projets' },
  { to: '/admin/articles', label: 'Articles' },
  { to: '/admin/commentaires', label: 'Commentaires', badge: 'comments' },
  { to: '/admin/messages', label: 'Messages', badge: 'messages' },
  { to: '/admin/courriels', label: 'Courriels' },
  { to: '/admin/competences', label: 'Compétences' },
  { to: '/admin/certifications', label: 'Certifications' },
  { to: '/admin/distinctions', label: 'Distinctions', also: '/admin/awards' },
  { to: '/admin/formations', label: 'Formations' },
  { to: '/admin/abonnes', label: 'Abonnés', also: '/admin/subscribers' },
];

export default class AdminLayout extends PureComponent {
  render() {
    const { email, initials, onSignOut, badges, children } = this.props;
    return (
      <div className="pf-admin">
        <aside className="pf-sb" aria-label="Administration">
          <span className="pf-logo" style={{ padding: '6px 14px 22px' }}>
            {initials}
            <i>.</i>{' '}
            <span className="pf-mono" style={{ color: 'var(--pf-vio)' }}>
              admin
            </span>
          </span>
          <nav
            className="pf-col"
            style={{ gap: 4 }}
            aria-label="Sections de l’administration"
          >
            {ADMIN_LINKS.map((l) => {
              const count = l.badge && badges ? badges[l.badge] : 0;
              return (
                <NavLink
                  key={l.to}
                  to={l.to}
                  exact={l.exact}
                  className="pf-sb__link"
                  activeClassName="active"
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
        </aside>
        <main className="pf-admin__main" id="contenu">
          {children}
        </main>
      </div>
    );
  }
}
