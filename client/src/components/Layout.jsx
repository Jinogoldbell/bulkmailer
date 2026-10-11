import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export function Brand() {
  return (
    <span className="brand">
      <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="7" fill="currentColor" />
        <path d="M6 11l10 7 10-7M6 11v10h20V11z" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      Postbag
    </span>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Brand />
          <nav aria-label="Main">
            <NavLink to="/" end>New mail</NavLink>
            <NavLink to="/history">History</NavLink>
          </nav>
          <div className="who">
            <span className="who-email">{user?.email}</span>
            <button className="btn btn-quiet" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
