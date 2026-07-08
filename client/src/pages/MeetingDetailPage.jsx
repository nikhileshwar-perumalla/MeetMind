import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';

const POLL_MS = 4000;

export default function MeetingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/meetings/${id}`);
      setMeeting(data.meeting);
      return data.meeting;
    } catch (err) {
      setError(errorMessage(err));
      return null;
    }
  }, [id]);

  // Load + poll while the pipeline is running.
  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      const m = await load();
      if (cancelled) return;
      if (m && (m.status === 'processing' || m.status === 'uploaded')) {
        pollRef.current = setTimeout(tick, POLL_MS);
      }
    };
    tick();

    return () => {
      cancelled = true;
      clearTimeout(pollRef.current);
    };
  }, [load]);

  const toggleAction = async (action) => {
    const status = action.status === 'done' ? 'open' : 'done';
    try {
      const { data } = await api.patch(`/meetings/${id}/actions/${action._id}`, { status });
      setMeeting(data.meeting);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const exportJira = async (action) => {
    setNotice('');
    setError('');
    try {
      await api.post(`/meetings/${id}/actions/${action._id}/jira`, {});
      await load();
      setNotice('Jira issue created.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const shareSlack = async () => {
    setNotice('');
    setError('');
    try {
      await api.post(`/meetings/${id}/share/slack`, {});
      setNotice('Summary posted to Slack.');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const reprocess = async () => {
    setNotice('');
    setError('');
    try {
      await api.post(`/meetings/${id}/reprocess`);
      setMeeting((m) => ({ ...m, status: 'processing' }));
      pollRef.current = setTimeout(load, POLL_MS);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this meeting permanently?')) return;
    try {
      await api.delete(`/meetings/${id}`);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (!meeting && !error) return <div className="page-loading">Loading…</div>;
  if (error && !meeting) return <div className="error-banner">{error}</div>;

  const processing = meeting.status === 'processing' || meeting.status === 'uploaded';

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{meeting.title}</h1>
          <p className="sub">
            {new Date(meeting.meetingDate).toLocaleDateString()} ·{' '}
            <span className={`badge ${meeting.status}`}>{meeting.status}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn secondary small" onClick={shareSlack} disabled={processing}>
            Share to Slack
          </button>
          <button className="btn secondary small" onClick={reprocess} disabled={processing}>
            Re-run AI
          </button>
          <button className="btn danger small" onClick={remove}>
            Delete
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {notice && <div className="success-banner">{notice}</div>}

      {processing && (
        <div className="card">
          <h2>⏳ Processing</h2>
          <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            Transcribing and analyzing this meeting. This page refreshes automatically.
          </p>
        </div>
      )}

      {meeting.status === 'failed' && (
        <div className="error-banner">
          Processing failed: {meeting.processingError || 'Unknown error'} — you can try “Re-run AI”.
        </div>
      )}

      {meeting.summary && (
        <div className="card">
          <h2>Summary</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{meeting.summary}</p>
          {meeting.topics?.length > 0 && (
            <div className="chip-row" style={{ marginTop: 12 }}>
              {meeting.topics.map((t) => (
                <span key={t} className="chip">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {meeting.keyDecisions?.length > 0 && (
        <div className="card">
          <h2>Key decisions</h2>
          <ul className="decisions">
            {meeting.keyDecisions.map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        </div>
      )}

      {meeting.actionItems?.length > 0 && (
        <div className="card">
          <h2>Action items</h2>
          {meeting.actionItems.map((a) => (
            <div key={a._id} className="action-item">
              <input
                type="checkbox"
                checked={a.status === 'done'}
                onChange={() => toggleAction(a)}
              />
              <div className="body">
                <div className={`title ${a.status === 'done' ? 'done' : ''}`}>{a.title}</div>
                <div className="meta">
                  {a.assignee && `👤 ${a.assignee} · `}
                  {a.dueDate && `📅 ${a.dueDate} · `}
                  {a.priority} priority
                  {a.jira?.issueKey && (
                    <>
                      {' · '}
                      <a href={a.jira.url} target="_blank" rel="noreferrer">
                        {a.jira.issueKey}
                      </a>
                    </>
                  )}
                </div>
              </div>
              {!a.jira?.issueKey && (
                <button className="btn secondary small" onClick={() => exportJira(a)}>
                  → Jira
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {meeting.transcript && (
        <div className="card">
          <h2>Transcript</h2>
          <div className="transcript-box">{meeting.transcript}</div>
        </div>
      )}
    </>
  );
}
