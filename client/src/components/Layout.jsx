import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogoMark,
  IconMeetings,
  IconPlus,
  IconSearch,
  IconUsers,
  IconLogout,
} from './Icons';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

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
          <LogoMark size={30} />
          <div>
            Meet<span>Mind</span>
          </div>
        </div>
        <NavLink to="/" end className="nav-link">
          <IconMeetings /> Meetings
        </NavLink>
        <NavLink to="/meetings/new" className="nav-link">
          <IconPlus /> New meeting
        </NavLink>
        <NavLink to="/search" className="nav-link">
          <IconSearch /> Search
        </NavLink>
        <NavLink to="/workspace" className="nav-link">
          <IconUsers /> Workspace
        </NavLink>
        <div className="spacer" />
        <div className="user-box">
          <div className="user-row">
            <div className="avatar">{initials(user?.name)}</div>
            <div className="user-meta">
              <div className="name">{user?.name}</div>
              <div className="ws">{workspace?.name}</div>
            </div>
          </div>
          {workspaces.length > 1 && (
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
          )}
          <button className="signout-btn" onClick={handleLogout}>
            <IconLogout size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
