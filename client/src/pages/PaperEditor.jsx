import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { ErrorAlert, LETTERS, PageHead, Spinner } from '../components/ui.jsx';

const blankQuestion = (optionCount) => ({
  text: '',
  options: Array(optionCount).fill(''),
  correctOption: null,
  topicId: '',
  topicSource: 'manual',
  explanation: '',
});

export default function PaperEditor() {
  const { classId: newClassId, paperId } = useParams();
  const navigate = useNavigate();

  const [cls, setCls] = useState(null);
  const [form, setForm] = useState({ title: '', testDate: '', optionCount: 4, questions: [blankQuestion(4)] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let classId = newClassId;
        if (paperId) {
          const { paper } = await api(`/papers/${paperId}`);
          if (!active) return;
          if (paper.status !== 'draft') {
            navigate(`/app/papers/${paperId}/results`, { replace: true });
            return;
          }
          classId = paper.class;
          setForm({
            title: paper.title,
            testDate: paper.testDate ? paper.testDate.slice(0, 10) : '',
            optionCount: paper.optionCount,
            questions: paper.questions.map((q) => ({ ...q, topicId: q.topicId || '' })),
          });
        }
        const data = await api(`/classes/${classId}`);
        if (active) setCls(data.class);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [newClassId, paperId, navigate]);

  const setQuestion = (index, patch) =>
    setForm((f) => ({ ...f, questions: f.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) }));

  const setOption = (index, option, value) =>
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i === index ? { ...q, options: q.options.map((o, j) => (j === option ? value : o)) } : q
      ),
    }));

  const setOptionCount = (optionCount) =>
    setForm((f) => ({
      ...f,
      optionCount,
      questions: f.questions.map((q) => ({
        ...q,
        options: Array.from({ length: optionCount }, (_, i) => q.options[i] ?? ''),
        correctOption: q.correctOption !== null && q.correctOption < optionCount ? q.correctOption : null,
      })),
    }));

  const addQuestion = () => setForm((f) => ({ ...f, questions: [...f.questions, blankQuestion(f.optionCount)] }));

  const removeQuestion = (index) =>
    setForm((f) => ({ ...f, questions: f.questions.filter((_, i) => i !== index) }));

  const body = () => ({
    classId: cls._id,
    title: form.title,
    testDate: form.testDate || null,
    optionCount: form.optionCount,
    questions: form.questions.map((q) => ({ ...q, topicId: q.topicId || null })),
  });

  // Saves the draft and returns its id.
  const persist = async () => {
    if (paperId) {
      await api(`/papers/${paperId}`, { method: 'PUT', body: body() });
      return paperId;
    }
    const { paper } = await api('/papers', { method: 'POST', body: body() });
    return paper._id;
  };

  const run = async (name, action) => {
    setBusy(name);
    setError('');
    setNotice('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const saveDraft = () =>
    run('save', async () => {
      const id = await persist();
      setNotice('Draft saved.');
      if (!paperId) navigate(`/app/papers/${id}/edit`, { replace: true });
    });

  const publish = () =>
    run('publish', async () => {
      const id = await persist();
      try {
        await api(`/papers/${id}/publish`, { method: 'POST' });
      } catch (err) {
        // the draft was saved even though it cannot be published yet
        if (!paperId) navigate(`/app/papers/${id}/edit`, { replace: true });
        throw err;
      }
      navigate(`/app/classes/${cls._id}`);
    });

  const remove = () =>
    run('delete', async () => {
      if (!window.confirm('Delete this draft paper?')) return;
      await api(`/papers/${paperId}`, { method: 'DELETE' });
      navigate(`/app/classes/${cls._id}`);
    });

  const suggestTopics = () =>
    run('suggest', async () => {
      const { suggestions } = await api('/papers/suggest-topics', { method: 'POST', body: body() });
      let filled = 0;
      const questions = form.questions.map((q, i) => {
        const suggestion = suggestions[i];
        // never overwrite a topic the teacher picked
        if (q.topicId || !suggestion?.topicId) return q;
        filled += 1;
        return { ...q, topicId: suggestion.topicId, topicSource: 'ai' };
      });
      setForm((f) => ({ ...f, questions }));
      setNotice(
        filled
          ? `Suggested a topic for ${filled} question${filled === 1 ? '' : 's'}. Check them before publishing.`
          : 'No new suggestions. Questions with a topic are left as they are.'
      );
    });

  if (loading) return <Spinner />;
  if (!cls) return <div className="page"><ErrorAlert message={error || 'Class not found'} /></div>;

  const answered = form.questions.filter((q) => q.correctOption !== null).length;

  return (
    <div className="page page-narrow">
      <PageHead
        back={{ to: `/app/classes/${cls._id}`, label: cls.name }}
        title={paperId ? 'Edit paper' : 'New paper'}
        subtitle="Enter every question with its options, then mark the correct answer."
      />

      <div className="stack">
        <div className="card">
          <label className="field">
            <span>Paper title</span>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Term Test 1 - MCQ" required />
          </label>
          <div className="form-row">
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Test date</span>
              <input className="input" type="date" value={form.testDate} onChange={(e) => setForm({ ...form, testDate: e.target.value })} />
            </label>
            <label className="field" style={{ marginBottom: 0 }}>
              <span>Options per question</span>
              <select className="input" value={form.optionCount} onChange={(e) => setOptionCount(Number(e.target.value))}>
                <option value={4}>4 (A to D)</option>
                <option value={5}>5 (A to E)</option>
              </select>
            </label>
          </div>
        </div>

        {cls.topics.length === 0 && (
          <div className="alert alert-info" style={{ margin: 0 }}>
            This class has no syllabus topics yet. Add them on the class Syllabus tab so questions can be linked to theory.
          </div>
        )}

        {form.questions.map((question, index) => (
          <div className="card question-card" key={index}>
            <div className="row" style={{ marginBottom: 12 }}>
              <span className="question-num">{index + 1}</span>
              <span className="spacer" />
              {form.questions.length > 1 && (
                <button className="icon-btn danger" onClick={() => removeQuestion(index)} aria-label={`Delete question ${index + 1}`}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <label className="field">
              <span>Question</span>
              <textarea className="input" rows={2} value={question.text} onChange={(e) => setQuestion(index, { text: e.target.value })} placeholder="Type the question" />
            </label>

            <div className="label" style={{ marginBottom: 8 }}>Options · tap the letter of the correct answer</div>
            {question.options.map((option, optionIndex) => (
              <div className="option-row" key={optionIndex}>
                <button
                  type="button"
                  className={`option-pick ${question.correctOption === optionIndex ? 'active' : ''}`}
                  aria-pressed={question.correctOption === optionIndex}
                  aria-label={`Mark ${LETTERS[optionIndex]} as the correct answer`}
                  onClick={() => setQuestion(index, { correctOption: optionIndex })}
                >
                  {LETTERS[optionIndex]}
                </button>
                <input
                  className="input"
                  value={option}
                  onChange={(e) => setOption(index, optionIndex, e.target.value)}
                  placeholder={`Option ${LETTERS[optionIndex]}`}
                  aria-label={`Question ${index + 1} option ${LETTERS[optionIndex]}`}
                />
              </div>
            ))}

            <div className="form-row" style={{ marginTop: 16 }}>
              <label className="field" style={{ marginBottom: 0 }}>
                <span className="row" style={{ gap: 6 }}>
                  Syllabus topic
                  {question.topicSource === 'ai' && question.topicId && (
                    <span className="badge badge-amber"><Sparkles size={12} /> AI suggestion</span>
                  )}
                </span>
                <select
                  className="input"
                  value={question.topicId}
                  onChange={(e) => setQuestion(index, { topicId: e.target.value, topicSource: 'manual' })}
                >
                  <option value="">No topic</option>
                  {cls.topics.map((topic) => (
                    <option key={topic._id} value={topic._id}>{topic.name}</option>
                  ))}
                </select>
              </label>
              <label className="field" style={{ marginBottom: 0 }}>
                <span>Explanation (optional)</span>
                <input className="input" value={question.explanation} onChange={(e) => setQuestion(index, { explanation: e.target.value })} placeholder="Shown to students who get it wrong" />
              </label>
            </div>
          </div>
        ))}

        <button className="btn btn-secondary" onClick={addQuestion}><Plus size={18} /> Add question</button>

        <ErrorAlert message={error} />
        {notice && <div className="alert alert-success" style={{ margin: 0 }}>{notice}</div>}

        <div className="sticky-actions">
          <span className="muted small spacer">
            {answered} of {form.questions.length} questions have a correct answer
          </span>
          {paperId && (
            <button className="btn btn-danger" onClick={remove} disabled={Boolean(busy)}>Delete</button>
          )}
          <button className="btn btn-secondary" onClick={suggestTopics} disabled={Boolean(busy) || cls.topics.length === 0}>
            <Sparkles size={16} /> {busy === 'suggest' ? 'Thinking…' : 'Suggest topics'}
          </button>
          <button className="btn btn-secondary" onClick={saveDraft} disabled={Boolean(busy)}>
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button className="btn" onClick={publish} disabled={Boolean(busy)}>
            {busy === 'publish' ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
