import { Camera } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api/client.js';
import { Avatar, ErrorAlert, PageHead } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#16a34a', '#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#ca8a04', '#475569'];

export default function Profile() {
  const { user, setUser } = useAuth();
  const isTeacher = user.role === 'teacher';

  const [form, setForm] = useState({
    name: user.name,
    bio: user.bio,
    phone: user.phone,
    school: user.school,
    grade: user.grade,
    institute: user.institute,
    subjects: user.subjects.join(', '),
    avatarColor: user.avatarColor,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const update = (event) => {
    setSaved(false);
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const run = async (action) => {
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      const data = await action();
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    const ok = await run(() =>
      api('/users/me', { method: 'PUT', body: { ...form, subjects: form.subjects.split(',') } })
    );
    setSaved(ok);
  };

  const uploadPhoto = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    run(() => api('/users/me/avatar', { method: 'POST', formData }));
  };

  const removePhoto = () => run(() => api('/users/me', { method: 'PUT', body: { avatarUrl: '' } }));

  return (
    <div className="page page-narrow">
      <PageHead title="Profile" subtitle="This is how you appear to your class." />

      <form className="stack" onSubmit={save}>
        <div className="card">
          <div className="row row-wrap" style={{ gap: 20 }}>
            <Avatar user={{ ...user, avatarColor: form.avatarColor, name: form.name }} size={88} />
            <div className="list-main">
              <div className="row row-wrap" style={{ marginBottom: 12 }}>
                <label className="btn btn-secondary btn-sm">
                  <Camera size={14} /> {user.avatarUrl ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadPhoto} hidden />
                </label>
                {user.avatarUrl && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={removePhoto} disabled={busy}>Remove photo</button>
                )}
              </div>
              <div className="label" style={{ marginBottom: 8 }}>Avatar color</div>
              <div className="color-swatches" role="radiogroup" aria-label="Avatar color">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={form.avatarColor === color}
                    aria-label={color}
                    className={`swatch ${form.avatarColor === color ? 'active' : ''}`}
                    style={{ background: color }}
                    onClick={() => {
                      setSaved(false);
                      setForm({ ...form, avatarColor: color });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="form-row">
            <label className="field">
              <span>Full name</span>
              <input className="input" name="name" value={form.name} onChange={update} required />
            </label>
            <label className="field">
              <span>Email</span>
              <input className="input" value={user.email} disabled />
            </label>
          </div>

          <div className="form-row">
            <label className="field">
              <span>Phone</span>
              <input className="input" name="phone" value={form.phone} onChange={update} />
            </label>
            {isTeacher ? (
              <label className="field">
                <span>Institute</span>
                <input className="input" name="institute" value={form.institute} onChange={update} />
              </label>
            ) : (
              <label className="field">
                <span>School</span>
                <input className="input" name="school" value={form.school} onChange={update} />
              </label>
            )}
          </div>

          {isTeacher ? (
            <label className="field">
              <span>Subjects you teach</span>
              <input className="input" name="subjects" value={form.subjects} onChange={update} placeholder="Physics, Combined Maths" />
              <span className="muted small" style={{ fontWeight: 400 }}>Separate subjects with commas.</span>
            </label>
          ) : (
            <label className="field">
              <span>Grade</span>
              <input className="input" name="grade" value={form.grade} onChange={update} placeholder="Grade 13" />
            </label>
          )}

          <label className="field">
            <span>About you</span>
            <textarea className="input" name="bio" value={form.bio} onChange={update} maxLength={300} rows={3} />
          </label>

          <ErrorAlert message={error} />
          {saved && <div className="alert alert-success">Profile saved.</div>}
          <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
