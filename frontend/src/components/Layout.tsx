import { NavLink, Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div>
      <nav className="nav">
        <div className="nav-inner">
          <NavLink to="/dashboard" className="nav-brand">
            <span className="accent-dot"></span>
            BreslerEDO
          </NavLink>
          <div className="nav-links">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Главная
            </NavLink>
            <NavLink
              to="/templates/new"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Новый шаблон
            </NavLink>
            <NavLink
              to="/parse"
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              Парсер
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
