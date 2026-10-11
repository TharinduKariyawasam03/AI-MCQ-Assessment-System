import { GraduationCap, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Brand, ErrorAlert } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    role: params.get('role') === 'teacher' ? 'teacher' : 'student',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
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
          <h1 style={{ marginBottom: 4 }}>Create your account</h1>
          <p className="muted" style={{ marginBottom: 20 }}>Choose how you will use My Teacher.</p>
          <ErrorAlert message={error} />

          <div className="role-picker" role="radiogroup" aria-label="Account type">
            {[
              { role: 'student', label: 'Student', icon: UserRound },
              { role: 'teacher', label: 'Teacher', icon: GraduationCap },
            ].map(({ role, label, icon: Icon }) => (
              <button
                key={role}
                type="button"
                role="radio"
                aria-checked={form.role === role}
                className={`role-option ${form.role === role ? 'active' : ''}`}
                onClick={() => setForm({ ...form, role })}
              >
                <Icon size={24} />
                {label}
              </button>
            ))}
          </div>

          <label className="field">
            <span>Full name</span>
            <input className="input" name="name" value={form.name} onChange={update} autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" name="email" value={form.email} onChange={update} autoComplete="email" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" minLength={6} required />
            <span className="muted small" style={{ fontWeight: 400 }}>At least 6 characters</span>
          </label>
          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Creating account…' : `Sign up as a ${form.role}`}
          </button>
          <p className="muted small" style={{ textAlign: 'center', marginTop: 16 }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
