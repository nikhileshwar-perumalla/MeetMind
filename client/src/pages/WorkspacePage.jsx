import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconUsers } from '../components/Icons';

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export default function WorkspacePage() {
  const { workspace, user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [role, setRole] = useState(null);
  const [error, setError] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!workspace) return;
    try {
      const { data } = await api.get(`/workspaces/${workspace._id}`);
      setDetail(data.workspace);
      setRole(data.role);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [workspace]);

  useEffect(() => {
    load();
  }, [load]);

  const invite = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post(`/workspaces/${workspace._id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setDetail(data.workspace);
      setInviteEmail('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (memberId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await api.delete(`/workspaces/${workspace._id}/members/${memberId}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const canManage = role === 'owner' || role === 'admin';

  if (!detail && !error) return <div className="page-loading">Loading…</div>;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{detail?.name}</h1>
          <p className="sub">Your role: {role}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <h2>
          <IconUsers size={16} /> Members
        </h2>
        <table className="members">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              {canManage && <th />}
            </tr>
          </thead>
          <tbody>
            {detail?.members?.map((m) => (
              <tr key={m.user._id}>
                <td>
                  <div className="member-cell">
                    <div className="avatar">{initials(m.user.name)}</div>
                    {m.user.name}
                  </div>
                </td>
                <td style={{ color: 'var(--text-dim)' }}>{m.user.email}</td>
                <td>
                  <span className={`role-chip ${m.role}`}>{m.role}</span>
                </td>
                {canManage && (
                  <td style={{ textAlign: 'right' }}>
                    {m.role !== 'owner' && m.user._id !== user._id && (
                      <button className="btn danger small" onClick={() => removeMember(m.user._id)}>
                        Remove
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage && (
        <div className="card">
          <h2>Invite a member</h2>
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: -6, marginBottom: 16 }}>
            The person must already have a MeetMind account.
          </p>
          <form onSubmit={invite} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <label className="field" style={{ flex: 1, marginBottom: 0 }}>
              <span>Email</span>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </label>
            <label className="field" style={{ width: 140, marginBottom: 0 }}>
              <span>Role</span>
              <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="btn" disabled={busy}>
              Invite
            </button>
          </form>
        </div>
      )}
    </>
  );
}
