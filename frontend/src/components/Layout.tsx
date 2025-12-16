import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to="/dashboard" className="nav-brand">
            <span className="accent-dot"></span>
            DocFlow Builder
          </NavLink>
          <div className="nav-links">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
            <NavLink to="/templates/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              New Template
            </NavLink>
            <NavLink to="/parse" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Parser
            </NavLink>
          </div>
        </div>
      </nav>
      <main className="container-1600">
        <Outlet />
      </main>
    </div>
  );
}
