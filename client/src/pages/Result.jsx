import { CheckCircle2, Lightbulb, Pencil, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import BubbleGrid from '../components/BubbleGrid.jsx';
import { Avatar, ErrorAlert, LETTERS, Loader, PageHead, formatDate, scoreTone } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const RING_COLORS = { green: 'var(--green-600)', amber: 'var(--amber-500)', red: 'var(--red-600)' };

function ReviewCard({ item }) {
  return (
    <div className={`card review ${item.isCorrect ? '' : 'wrong'}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <span className="question-num" style={{ background: item.isCorrect ? undefined : 'var(--red-600)' }}>{item.number}</span>
        <div className="list-main">
          <div style={{ fontWeight: 600 }}>{item.text}</div>
          {item.topic && <span className="badge badge-gray" style={{ marginTop: 6 }}>{item.topic.name}</span>}
        </div>
        {item.isCorrect ? <CheckCircle2 size={22} color="#16a34a" aria-label="Correct" /> : <XCircle size={22} color="#dc2626" aria-label="Wrong" />}
      </div>

      {item.options.map((option, index) => {
        const isAnswer = index === item.correctOption;
        const isChosen = index === item.selected;
        return (
          <div className={`review-option ${isAnswer ? 'correct' : isChosen ? 'chosen-wrong' : ''}`} key={index}>
            <span className="letter">{LETTERS[index]}</span>
            <span className="spacer">{option}</span>
            {isAnswer && <span className="badge">Correct answer</span>}
            {isChosen && !isAnswer && <span className="badge badge-red">Your answer</span>}
            {isChosen && isAnswer && <span className="muted small">Your answer</span>}
          </div>
        );
      })}

      {!item.isCorrect && item.selected === null && <p className="muted small" style={{ marginTop: 8 }}>Left blank.</p>}

      {!item.isCorrect && (item.explanation || item.topic) && (
        <div className="theory">
          <div className="theory-title">
            <Lightbulb size={16} /> {item.topic ? `Revise: ${item.topic.name}` : 'Why this is wrong'}
          </div>
          <span className="pre-line">{item.explanation || 'Your teacher has not added a theory note for this topic yet.'}</span>
        </div>
      )}
    </div>
  );
}

export default function Result() {
  const { id } = useParams();
  const { user } = useAuth();
  const isTeacher = user.role === 'teacher';
  const query = useApi(`/submissions/${id}`);

  const [filter, setFilter] = useState('all');
  const [draft, setDraft] = useState(null); // answers being corrected by the teacher
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const saveCorrection = async () => {
    setBusy(true);
    setError('');
    try {
      query.setData(await api(`/submissions/${id}`, { method: 'PUT', body: { answers: draft } }));
      setDraft(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page-narrow">
      <Loader query={query}>
        {({ submission, paper, review }) => {
          const wrong = review.filter((item) => !item.isCorrect);
          const shown = filter === 'wrong' ? wrong : review;
          const tone = scoreTone(submission.percentage);
          const topics = [...new Set(wrong.map((item) => item.topic?.name).filter(Boolean))];

          return (
            <>
              <PageHead
                back={
                  isTeacher
                    ? { to: `/app/papers/${paper._id}/results`, label: 'All results' }
                    : { to: `/app/classes/${paper.class._id}`, label: paper.class.name || 'Back to class' }
                }
                title={paper.title}
                subtitle={`Submitted ${formatDate(submission.createdAt)}`}
              />

              <div className="stack">
                <div className="card row row-wrap" style={{ gap: 24 }}>
                  <div className="score-ring" style={{ '--pct': submission.percentage, '--ring-color': RING_COLORS[tone] }}>
                    <div>
                      {submission.percentage}%
                      <small>{submission.score} of {submission.total}</small>
                    </div>
                  </div>
                  <div className="list-main">
                    {isTeacher && (
                      <div className="row" style={{ marginBottom: 8 }}>
                        <Avatar user={submission.student} size={32} />
                        <strong>{submission.student?.name || 'Removed student'}</strong>
                      </div>
                    )}
                    <h2>
                      {submission.score} correct, {submission.total - submission.score} wrong
                    </h2>
                    <p className="muted" style={{ marginTop: 4 }}>
                      {topics.length ? `Topics to revise: ${topics.join(', ')}.` : wrong.length ? 'Review the questions below.' : 'Full marks. Excellent work!'}
                    </p>
                    {submission.reviewedByTeacher && <span className="badge badge-gray" style={{ marginTop: 8 }}>Corrected by teacher</span>}
                  </div>
                </div>

                {isTeacher && (
                  <div className="card">
                    <div className="card-head">
                      <h2>Answer sheet</h2>
                      {!draft && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setDraft(review.map((item) => item.selected))}>
                          <Pencil size={14} /> Correct answers
                        </button>
                      )}
                    </div>
                    {submission.imageUrl ? (
                      <a href={submission.imageUrl} target="_blank" rel="noreferrer">
                        <img className="sheet-preview" src={submission.imageUrl} alt="Uploaded answer sheet" />
                      </a>
                    ) : (
                      <p className="muted">No photo was uploaded.</p>
                    )}

                    {draft && (
                      <div style={{ marginTop: 20 }}>
                        <p className="muted small" style={{ marginBottom: 12 }}>
                          Set each answer to match the sheet. Marks are recalculated when you save.
                        </p>
                        <BubbleGrid answers={draft} optionCount={paper.optionCount} onChange={setDraft} disabled={busy} />
                        <ErrorAlert message={error} />
                        <div className="modal-actions" style={{ marginTop: 16 }}>
                          <button className="btn btn-secondary" onClick={() => setDraft(null)} disabled={busy}>Cancel</button>
                          <button className="btn" onClick={saveCorrection} disabled={busy}>{busy ? 'Saving…' : 'Save and re-mark'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="tabs" style={{ marginBottom: 0 }}>
                  <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All questions ({review.length})</button>
                  <button className={`tab ${filter === 'wrong' ? 'active' : ''}`} onClick={() => setFilter('wrong')}>Wrong answers ({wrong.length})</button>
                </div>

                {shown.length === 0 && <p className="muted">No wrong answers.</p>}
                {shown.map((item) => <ReviewCard item={item} key={item.number} />)}
              </div>
            </>
          );
        }}
      </Loader>
    </div>
  );
}
