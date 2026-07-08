import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

function formatDate(d) {
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DashboardPage() {
  const { workspace } = useAuth();
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workspace) return;
    api
      .get('/meetings', { params: { workspaceId: workspace._id } })
      .then(({ data }) => setMeetings(data.meetings))
      .catch((err) => setError(errorMessage(err)));
  }, [workspace]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Meetings</h1>
          <p className="sub">{workspace?.name}</p>
        </div>
        <Link to="/meetings/new" className="btn">
          + New meeting
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {meetings === null && !error && <div className="page-loading">Loading meetings…</div>}

      {meetings?.length === 0 && (
        <div className="empty-state">
          <p>No meetings yet.</p>
          <p>
            <Link to="/meetings/new">Upload your first recording</Link> to generate a transcript,
            summary, and action items.
          </p>
        </div>
      )}

      <div className="meeting-list">
        {meetings?.map((m) => (
          <Link key={m._id} to={`/meetings/${m._id}`} className="meeting-row">
            <div>
              <div className="title">{m.title}</div>
              <div className="meta">
                {formatDate(m.meetingDate)}
                {m.participants?.length > 0 && ` · ${m.participants.join(', ')}`}
                {m.actionItems?.length > 0 && ` · ${m.actionItems.length} action items`}
              </div>
            </div>
            <span className={`badge ${m.status}`}>{m.status}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
