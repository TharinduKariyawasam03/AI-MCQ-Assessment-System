import { Camera, RefreshCw, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import BubbleGrid from '../components/BubbleGrid.jsx';
import { ErrorAlert, Loader, PageHead } from '../components/ui.jsx';

export default function SubmitSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const query = useApi(`/papers/${id}`);

  const [imageUrl, setImageUrl] = useState('');
  const [answers, setAnswers] = useState([]);
  const [source, setSource] = useState('manual');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const paper = query.data?.paper;
  const submittedId = query.data?.mySubmissionId;

  useEffect(() => {
    if (submittedId) navigate(`/app/submissions/${submittedId}`, { replace: true });
  }, [submittedId, navigate]);

  useEffect(() => {
    if (paper) setAnswers(Array(paper.questions.length).fill(null));
  }, [paper]);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBusy('upload');
    setError('');
    try {
      const formData = new FormData();
      formData.append('sheet', file);
      const data = await api(`/papers/${id}/scan`, { method: 'POST', formData });
      setImageUrl(data.imageUrl);
      if (data.detected) {
        setAnswers(data.detected.map((answer) => answer.selected));
        setSource('ai');
      } else {
        setSource('manual');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    const blanks = answers.filter((answer) => answer === null).length;
    if (blanks && !window.confirm(`${blanks} question${blanks === 1 ? ' is' : 's are'} blank and will be marked wrong. Submit anyway?`)) {
      return;
    }
    if (!blanks && !window.confirm('You can submit only once. Submit your answers now?')) return;

    setBusy('submit');
    setError('');
    try {
      const { submission } = await api(`/papers/${id}/submissions`, { method: 'POST', body: { imageUrl, answers, source } });
      navigate(`/app/submissions/${submission._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy('');
    }
  };

  const marked = answers.filter((answer) => answer !== null).length;

  return (
    <div className="page page-narrow">
      <Loader query={query}>
        {({ paper }) => (
          <>
            <PageHead
              back={{ to: `/app/classes/${paper.class}`, label: 'Back to class' }}
              title={paper.title}
              subtitle={`${paper.questions.length} ${paper.questions.length === 1 ? 'question' : 'questions'} · Upload your answer sheet to get your marks.`}
            />

            {paper.status !== 'published' ? (
              <div className="alert alert-info">This paper is closed and no longer accepts answer sheets.</div>
            ) : (
              <div className="stack">
                <div className="card">
                  <div className="card-head">
                    <h2>1. Photo of your answer sheet</h2>
                    {imageUrl && (
                      <label className="btn btn-secondary btn-sm">
                        <RefreshCw size={14} /> Replace
                        <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} hidden />
                      </label>
                    )}
                  </div>
                  {imageUrl ? (
                    <img className="sheet-preview" src={imageUrl} alt="Your uploaded answer sheet" />
                  ) : (
                    <label className="dropzone">
                      <Camera size={32} color="#16a34a" />
                      <strong style={{ color: 'var(--ink)' }}>{busy === 'upload' ? 'Uploading…' : 'Take or choose a photo'}</strong>
                      <span className="small">JPEG, PNG or WebP, up to 8 MB. Keep the whole sheet in the frame.</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={upload} disabled={busy === 'upload'} />
                    </label>
                  )}
                </div>

                {imageUrl && (
                  <div className="card">
                    <div className="card-head">
                      <h2>2. {source === 'ai' ? 'Check your answers' : 'Mark your answers'}</h2>
                      <span className="muted small">{marked} of {answers.length} marked</span>
                    </div>
                    <p className="muted small" style={{ marginBottom: 12 }}>
                      {source === 'ai' ? (
                        <><Sparkles size={13} /> These were read from your photo. Fix any that are wrong.</>
                      ) : (
                        'Copy your answers exactly as they are on your sheet. Your teacher can check them against the photo.'
                      )}
                    </p>
                    <BubbleGrid answers={answers} optionCount={paper.optionCount} onChange={setAnswers} disabled={busy === 'submit'} />
                  </div>
                )}

                <ErrorAlert message={error} />

                {imageUrl && (
                  <div className="sticky-actions">
                    <span className="muted small spacer">You can submit only once.</span>
                    <button className="btn" onClick={submit} disabled={Boolean(busy)}>
                      {busy === 'submit' ? 'Marking…' : 'Submit and see my marks'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Loader>
    </div>
  );
}
