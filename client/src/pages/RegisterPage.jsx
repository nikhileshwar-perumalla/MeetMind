import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../api/client';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create your account</h1>
        <p className="sub">Start turning meetings into knowledge</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={set('name')} required autoFocus />
          </label>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label className="field">
            <span>Password (min 8 characters)</span>
            <input type="password" value={form.password} onChange={set('password')} minLength={8} required />
          </label>
          <button className="btn block" disabled={busy}>
            {busy ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="alt">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
