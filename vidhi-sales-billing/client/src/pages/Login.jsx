import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api, getToken } from '../api';

export default function Login() {
  const nav = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (getToken()) return <Navigate to="/" replace />;

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.username.trim() || !form.password) return setError('Please enter username and password');
    setBusy(true);
    try {
      const data = await api.post('/auth/login', form);
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('username', data.username);
      nav('/');
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand dark">VIDHI <span>SALES</span></div>
        <p className="muted center">Housekeeping & Professional Cleaning Solutions</p>
        <h2>Admin Login</h2>
        {error && <div className="alert error">{error}</div>}
        <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoFocus /></label>
        <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn primary block" disabled={busy}>{busy ? 'Signing in...' : 'Login'}</button>
        <p className="muted center small">Phone: 9049007159</p>
      </form>
    </div>
  );
}
