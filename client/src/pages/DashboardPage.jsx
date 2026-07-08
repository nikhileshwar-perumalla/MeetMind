import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconMic, IconPlus } from '../components/Icons';

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
          <IconPlus size={16} /> New meeting
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {meetings === null && !error && <div className="page-loading">Loading meetings…</div>}

      {meetings?.length === 0 && (
        <div className="empty-state">
          <div className="icon-bubble">
            <IconMic size={26} />
          </div>
          <div className="title">No meetings yet</div>
          <p>
            Upload a recording or paste a transcript — MeetMind will generate the summary,
            key decisions, and action items for you.
          </p>
          <Link to="/meetings/new" className="btn">
            <IconPlus size={16} /> Add your first meeting
          </Link>
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
