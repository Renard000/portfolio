import { PureComponent } from 'react';
import { NavLink } from 'react-router-dom';

export default class Navbar extends PureComponent {
  render() {
    return (
      <nav
        className="navbar navbar-expand navbar-dark bg-dark"
        aria-label="Navigation principale"
      >
        <div className="container">
          <NavLink className="navbar-brand" to="/" exact>
            <i className="fa-solid fa-code me-2" aria-hidden="true" />
            Accueil
          </NavLink>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" activeClassName="active" to="/certifications">
                Certifications
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" activeClassName="active" to="/distinctions">
                Distinctions
              </NavLink>
            </li>
          </ul>
          <NavLink
            className="nav-link text-secondary small"
            activeClassName="active"
            to="/admin"
          >
            Admin
          </NavLink>
        </div>
      </nav>
    );
  }
}
