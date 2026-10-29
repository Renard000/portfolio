import { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

export default class AdminLayout extends PureComponent {
  render() {
    const { email, onSignOut, children } = this.props;
    return (
      <div className="container py-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <ul className="nav nav-pills">
            <li className="nav-item">
              <NavLink
                className="nav-link"
                activeClassName="active"
                to="/admin/certifications"
              >
                Certifications
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" activeClassName="active" to="/admin/awards">
                Distinctions
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className="nav-link"
                activeClassName="active"
                to="/admin/formations"
              >
                Formations
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className="nav-link"
                activeClassName="active"
                to="/admin/subscribers"
              >
                Abonnés
              </NavLink>
            </li>
          </ul>
          <div className="small text-muted">
            {email}{' '}
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary ms-2"
              onClick={onSignOut}
            >
              Déconnexion
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }
}
