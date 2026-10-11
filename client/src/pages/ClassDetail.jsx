import { BookText, Copy, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { Avatar, Empty, ErrorAlert, Loader, Meter, Modal, PageHead, ScoreBadge, StatusBadge, formatDate, scoreTone } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function PapersTab({ classId, isTeacher }) {
  const query = useApi(`/papers?class=${classId}`);

  return (
    <Loader query={query}>
      {({ papers }) =>
        papers.length === 0 ? (
          <div className="card">
            <Empty icon={FileText} title="No papers yet">
              {isTeacher ? 'Create a paper with its questions and correct answers.' : 'Your teacher has not published a paper yet.'}
              {isTeacher && (
                <>
                  <br />
                  <Link className="btn" to={`/app/classes/${classId}/papers/new`}><Plus size={18} /> New paper</Link>
                </>
              )}
            </Empty>
          </div>
        ) : (
          <div className="card">
            <div className="list">
              {papers.map((paper) => (
                <div className="list-item" key={paper._id}>
                  <span className="stat-icon" style={{ margin: 0 }}><FileText size={18} /></span>
                  <div className="list-main">
                    <div className="row" style={{ gap: 8 }}>
                      <span className="truncate" style={{ fontWeight: 600 }}>{paper.title}</span>
                      <StatusBadge status={paper.status} />
                    </div>
                    <div className="muted small">
                      {paper.questionCount} {paper.questionCount === 1 ? 'question' : 'questions'}
                      {paper.testDate && ` · ${formatDate(paper.testDate)}`}
                      {isTeacher && paper.status !== 'draft' && ` · ${paper.submissionCount} submitted`}
                    </div>
                  </div>
                  {isTeacher ? (
                    paper.status === 'draft' ? (
                      <Link className="btn btn-secondary btn-sm" to={`/app/papers/${paper._id}/edit`}>Edit</Link>
                    ) : (
                      <Link className="btn btn-secondary btn-sm" to={`/app/papers/${paper._id}/results`}>Results</Link>
                    )
                  ) : paper.mySubmission ? (
                    <>
                      <ScoreBadge percentage={paper.mySubmission.percentage} />
                      <Link className="btn btn-secondary btn-sm" to={`/app/submissions/${paper.mySubmission._id}`}>View result</Link>
                    </>
                  ) : paper.status === 'published' ? (
                    <Link className="btn btn-sm" to={`/app/papers/${paper._id}/submit`}>Submit sheet</Link>
                  ) : (
                    <span className="muted small">Not submitted</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }
    </Loader>
  );
}

function TopicModal({ classId, topic, onClose, onSaved }) {
  const [form, setForm] = useState({ name: topic?.name || '', theory: topic?.theory || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const data = topic
        ? await api(`/classes/${classId}/topics/${topic._id}`, { method: 'PUT', body: form })
        : await api(`/classes/${classId}/topics`, { method: 'POST', body: form });
      onSaved(data.topics);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={topic ? 'Edit topic' : 'Add a topic'} onClose={onClose}>
      <form onSubmit={submit}>
        <ErrorAlert message={error} />
        <label className="field">
          <span>Topic name</span>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Electricity" autoFocus required />
        </label>
        <label className="field">
          <span>Theory note</span>
          <textarea
            className="input"
            rows={6}
            value={form.theory}
            onChange={(e) => setForm({ ...form, theory: e.target.value })}
            placeholder="The key theory a student should revise for this topic. Shown under every wrong answer on this topic."
          />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn" disabled={busy}>Save topic</button>
        </div>
      </form>
    </Modal>
  );
}

function SyllabusTab({ cls, isTeacher, onTopics }) {
  // null = closed, {} = adding, a topic = editing
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const remove = async (topic) => {
    if (!window.confirm(`Delete the topic "${topic.name}"? Questions tagged with it become untagged.`)) return;
    try {
      const data = await api(`/classes/${cls._id}/topics/${topic._id}`, { method: 'DELETE' });
      onTopics(data.topics);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="stack">
      <ErrorAlert message={error} />
      {isTeacher && (
        <div className="row">
          <p className="muted small spacer">
            Topics are the theory parts of your syllabus. Each question is linked to one topic.
          </p>
          <button className="btn" onClick={() => setEditing({})}><Plus size={18} /> Add topic</button>
        </div>
      )}

      {cls.topics.length === 0 ? (
        <div className="card">
          <Empty icon={BookText} title="No syllabus topics yet">
            {isTeacher ? 'Add the topics of this class so questions can be linked to them.' : 'Your teacher has not added topics yet.'}
          </Empty>
        </div>
      ) : (
        cls.topics.map((topic) => (
          <div className="card" key={topic._id}>
            <div className="row">
              <h2 className="spacer">{topic.name}</h2>
              {isTeacher && (
                <>
                  <button className="icon-btn" onClick={() => setEditing(topic)} aria-label={`Edit ${topic.name}`}><Pencil size={16} /></button>
                  <button className="icon-btn danger" onClick={() => remove(topic)} aria-label={`Delete ${topic.name}`}><Trash2 size={16} /></button>
                </>
              )}
            </div>
            <p className="muted pre-line" style={{ marginTop: 8 }}>{topic.theory || 'No theory note yet.'}</p>
          </div>
        ))
      )}

      {editing && (
        <TopicModal
          classId={cls._id}
          topic={editing._id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={(topics) => {
            onTopics(topics);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function StudentsTab({ classId }) {
  const query = useApi(`/analytics/classes/${classId}`);

  const remove = async (student) => {
    if (!window.confirm(`Remove ${student.name} from this class? Their past results are kept.`)) return;
    await api(`/classes/${classId}/students/${student._id}`, { method: 'DELETE' });
    query.reload();
  };

  return (
    <Loader query={query}>
      {({ students, topics, summary }) =>
        students.length === 0 ? (
          <div className="card">
            <Empty icon={Users} title="No students yet">Share the class code with your students so they can join.</Empty>
          </div>
        ) : (
          <div className="stack">
            {topics.length > 0 && (
              <div className="card">
                <div className="card-head">
                  <h2>Class accuracy by topic</h2>
                  <span className="muted small">Average score {summary.average}%</span>
                </div>
                {topics.map((topic) => (
                  <Meter key={topic.topicId} label={topic.name} hint={`${topic.attempted} answers`} value={topic.accuracy} tone={scoreTone(topic.accuracy)} />
                ))}
              </div>
            )}

            <div className="card">
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th className="num">Papers</th>
                      <th className="num">Average</th>
                      <th>Weak topics</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(({ student, papers, average, weakTopics }) => (
                      <tr key={student._id}>
                        <td>
                          <div className="row">
                            <Avatar user={student} size={32} />
                            <div>
                              <div style={{ fontWeight: 600 }}>{student.name}</div>
                              <div className="muted small">{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="num">{papers}</td>
                        <td className="num">{papers ? <ScoreBadge percentage={average} /> : <span className="muted">-</span>}</td>
                        <td>
                          <div className="row row-wrap" style={{ gap: 6 }}>
                            {weakTopics.length === 0 && <span className="muted small">None</span>}
                            {weakTopics.map((topic) => (
                              <span className="badge badge-amber" key={topic.name}>{topic.name} · {topic.errorRate}% wrong</span>
                            ))}
                          </div>
                        </td>
                        <td className="num">
                          <button className="icon-btn danger" onClick={() => remove(student)} aria-label={`Remove ${student.name}`}><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      }
    </Loader>
  );
}

export default function ClassDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isTeacher = user.role === 'teacher';
  const query = useApi(`/classes/${id}`);
  const [tab, setTab] = useState('papers');
  const [copied, setCopied] = useState(false);

  const tabs = [
    { key: 'papers', label: 'Papers' },
    { key: 'syllabus', label: 'Syllabus' },
    ...(isTeacher ? [{ key: 'students', label: 'Students' }] : []),
  ];

  return (
    <div className="page">
      <Loader query={query}>
        {({ class: cls }) => {
          const copyCode = async () => {
            await navigator.clipboard.writeText(cls.joinCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          };

          return (
            <>
              <PageHead
                back={{ to: '/app/classes', label: 'Classes' }}
                title={cls.name}
                subtitle={[cls.subject, cls.grade, !isTeacher && cls.teacher?.name].filter(Boolean).join(' · ')}
              >
                {isTeacher && (
                  <>
                    <button className="btn btn-secondary" onClick={copyCode} title="Copy the class code">
                      <span className="code">{cls.joinCode}</span>
                      <Copy size={15} />
                      {copied && <span className="small">Copied</span>}
                    </button>
                    <Link className="btn" to={`/app/classes/${cls._id}/papers/new`}><Plus size={18} /> New paper</Link>
                  </>
                )}
              </PageHead>

              <div className="tabs" role="tablist">
                {tabs.map(({ key, label }) => (
                  <button key={key} role="tab" aria-selected={tab === key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'papers' && <PapersTab classId={cls._id} isTeacher={isTeacher} />}
              {tab === 'syllabus' && (
                <SyllabusTab cls={cls} isTeacher={isTeacher} onTopics={(topics) => query.setData({ class: { ...cls, topics } })} />
              )}
              {tab === 'students' && <StudentsTab classId={cls._id} />}
            </>
          );
        }}
      </Loader>
    </div>
  );
}
