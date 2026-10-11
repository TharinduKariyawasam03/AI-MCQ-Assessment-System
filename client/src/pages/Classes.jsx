import { BookOpen, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { Empty, ErrorAlert, Loader, Modal, PageHead } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function CreateClassModal({ onClose }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', subject: '', grade: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api('/classes', { method: 'POST', body: form });
      navigate(`/app/classes/${data.class._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Create a class" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorAlert message={error} />
        <label className="field">
          <span>Class name</span>
          <input className="input" name="name" value={form.name} onChange={update} placeholder="A/L Physics 2026 Theory" autoFocus required />
        </label>
        <div className="form-row">
          <label className="field">
            <span>Subject</span>
            <input className="input" name="subject" value={form.subject} onChange={update} placeholder="Physics" />
          </label>
          <label className="field">
            <span>Grade</span>
            <input className="input" name="grade" value={form.grade} onChange={update} placeholder="Grade 13" />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Create class</button>
        </div>
      </form>
    </Modal>
  );
}

function JoinClassModal({ onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api('/classes/join', { method: 'POST', body: { code } });
      navigate(`/app/classes/${data.class._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Join a class" onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorAlert message={error} />
        <label className="field">
          <span>Class code</span>
          <input
            className="input code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            autoFocus
            required
          />
          <span className="muted small" style={{ fontWeight: 400 }}>Your teacher gives you this 6-character code.</span>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Join class</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Classes() {
  const { user } = useAuth();
  const isTeacher = user.role === 'teacher';
  const query = useApi('/classes');
  const [open, setOpen] = useState(false);

  const action = (
    <button className="btn" onClick={() => setOpen(true)}>
      <Plus size={18} /> {isTeacher ? 'New class' : 'Join a class'}
    </button>
  );

  return (
    <div className="page">
      <PageHead title="Classes" subtitle={isTeacher ? 'Classes you teach.' : 'Classes you have joined.'}>
        {action}
      </PageHead>

      <Loader query={query}>
        {({ classes }) =>
          classes.length === 0 ? (
            <div className="card">
              <Empty icon={BookOpen} title={isTeacher ? 'Create your first class' : 'You have not joined a class yet'}>
                {isTeacher
                  ? 'Each class has its own students, syllabus and papers.'
                  : 'Ask your teacher for the class code, then join here.'}
                <br />
                {action}
              </Empty>
            </div>
          ) : (
            <div className="grid grid-cards">
              {classes.map((cls) => (
                <Link className="card card-link" key={cls._id} to={`/app/classes/${cls._id}`}>
                  <span className="stat-icon"><BookOpen size={18} /></span>
                  <h2>{cls.name}</h2>
                  <p className="muted small" style={{ marginTop: 2 }}>
                    {[cls.subject, cls.grade].filter(Boolean).join(' · ') || 'No subject set'}
                  </p>
                  <div className="row" style={{ marginTop: 16, justifyContent: 'space-between' }}>
                    <span className="row muted small" style={{ gap: 6 }}>
                      <Users size={15} /> {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
                    </span>
                    {isTeacher ? (
                      <span className="badge code">{cls.joinCode}</span>
                    ) : (
                      <span className="muted small">{cls.teacher?.name}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </Loader>

      {open && (isTeacher ? <CreateClassModal onClose={() => setOpen(false)} /> : <JoinClassModal onClose={() => setOpen(false)} />)}
    </div>
  );
}
