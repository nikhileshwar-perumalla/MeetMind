import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function NewMeetingPage() {
  const { workspace } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState('upload'); // 'upload' | 'transcript'
  const [title, setTitle] = useState('');
  const [participants, setParticipants] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'upload' && !file) return setError('Choose an audio or video file.');
    if (mode === 'transcript' && !transcript.trim())
      return setError('Paste the meeting transcript.');

    setBusy(true);
    try {
      const form = new FormData();
      form.append('workspaceId', workspace._id);
      form.append('title', title);
      if (participants) form.append('participants', participants);
      if (meetingDate) form.append('meetingDate', meetingDate);
      if (mode === 'upload') form.append('media', file);
      else form.append('transcript', transcript);

      const { data } = await api.post('/meetings', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      navigate(`/meetings/${data.meeting._id}`);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>New meeting</h1>
          <p className="sub">Upload a recording or paste a transcript — MeetMind does the rest.</p>
        </div>
      </div>

      <div className="card">
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Meeting title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Product Roadmap Review"
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span>Participants (comma-separated, optional)</span>
            <input
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="Alice, Bob, Charlie"
            />
          </label>

          <label className="field">
            <span>Meeting date (optional)</span>
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
            />
          </label>

          <div className="chip-row" style={{ marginBottom: 14 }}>
            <button
              type="button"
              className={`btn small ${mode === 'upload' ? '' : 'secondary'}`}
              onClick={() => setMode('upload')}
            >
              Upload recording
            </button>
            <button
              type="button"
              className={`btn small ${mode === 'transcript' ? '' : 'secondary'}`}
              onClick={() => setMode('transcript')}
            >
              Paste transcript
            </button>
          </div>

          {mode === 'upload' ? (
            <label className="field">
              <span>Audio / video file (mp3, wav, m4a, mp4, webm — up to 100 MB)</span>
              <input
                type="file"
                accept="audio/*,video/mp4,video/webm,video/quicktime"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          ) : (
            <label className="field">
              <span>Transcript</span>
              <textarea
                rows={10}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Paste the raw meeting transcript here…"
              />
            </label>
          )}

          <button className="btn" disabled={busy}>
            {busy
              ? mode === 'upload' && progress > 0 && progress < 100
                ? `Uploading… ${progress}%`
                : 'Uploading…'
              : 'Create meeting'}
          </button>
          {busy && mode === 'upload' && progress > 0 && (
            <div className="progress-track" aria-hidden>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </form>
      </div>
    </>
  );
}
