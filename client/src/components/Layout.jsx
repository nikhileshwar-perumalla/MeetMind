import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, workspace, workspaces, switchWorkspace, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          Meet<span>Mind</span>
        </div>
        <NavLink to="/" end className="nav-link">
          📋 Meetings
        </NavLink>
        <NavLink to="/meetings/new" className="nav-link">
          ⬆️ New Meeting
        </NavLink>
        <NavLink to="/search" className="nav-link">
          🔍 Search
        </NavLink>
        <NavLink to="/workspace" className="nav-link">
          👥 Workspace
        </NavLink>
        <div className="spacer" />
        <div className="user-box">
          <div className="name">{user?.name}</div>
          {workspaces.length > 1 ? (
            <select
              className="workspace-select"
              value={workspace?._id || ''}
              onChange={(e) => switchWorkspace(e.target.value)}
              aria-label="Switch workspace"
            >
              {workspaces.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <div>{workspace?.name}</div>
          )}
          <button className="btn secondary small" style={{ marginTop: 10 }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
