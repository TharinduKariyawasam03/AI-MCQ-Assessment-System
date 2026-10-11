import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Brand, ErrorAlert } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <Brand />
        <form className="card" onSubmit={submit}>
          <h1 style={{ marginBottom: 4 }}>Welcome back</h1>
          <p className="muted" style={{ marginBottom: 20 }}>Log in to your account.</p>
          <ErrorAlert message={error} />
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" name="email" value={form.email} onChange={update} autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" name="password" value={form.password} onChange={update} autoComplete="current-password" required />
          </label>
          <button className="btn btn-block" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
