import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { IconSearch } from '../components/Icons';

export default function SearchPage() {
  const { workspace } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/search', {
        workspaceId: workspace._id,
        query: query.trim(),
      });
      setResults(data.results);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Semantic search</h1>
          <p className="sub">Ask anything discussed across your meetings.</p>
        </div>
      </div>

      <form className="search-bar" onSubmit={submit}>
        <span style={{ display: 'grid', placeItems: 'center', paddingLeft: 10, color: 'var(--text-faint)' }}>
          <IconSearch size={18} />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='e.g. "what did we decide about pricing?"'
          autoFocus
        />
        <button className="btn" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      {results !== null && results.length === 0 && (
        <div className="empty-state">
          <div className="icon-bubble">
            <IconSearch size={24} />
          </div>
          <div className="title">No matches</div>
          <p>Try rephrasing your question or using different keywords.</p>
        </div>
      )}

      {results?.map((r) => (
        <div key={r.meetingId} className="card search-result">
          <h2>
            <Link to={`/meetings/${r.meetingId}`}>{r.title}</Link>{' '}
            <span className="score">{Math.round(r.topScore * 100)}% match</span>
          </h2>
          {r.meetingDate && (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {new Date(r.meetingDate).toLocaleDateString()}
            </div>
          )}
          {r.matches.slice(0, 3).map((m, i) => (
            <div key={i} className="snippet">
              …{m.snippet}…
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
