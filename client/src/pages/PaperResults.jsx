import { ClipboardList, Percent, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useApi } from '../api/useApi.js';
import { Avatar, Empty, ErrorAlert, LETTERS, Loader, Meter, PageHead, ScoreBadge, Stat, StatusBadge, formatDate, scoreTone } from '../components/ui.jsx';

export default function PaperResults() {
  const { id } = useParams();
  const paperQuery = useApi(`/papers/${id}`);
  const submissionsQuery = useApi(`/papers/${id}/submissions`);
  const statsQuery = useApi(`/analytics/papers/${id}`);
  const [error, setError] = useState('');

  const setStatus = async (action) => {
    setError('');
    try {
      paperQuery.setData(await api(`/papers/${id}/${action}`, { method: 'POST' }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <Loader query={paperQuery}>
        {({ paper }) => (
          <>
            <PageHead
              back={{ to: `/app/classes/${paper.class}`, label: 'Back to class' }}
              title={paper.title}
              subtitle={[`${paper.questions.length} ${paper.questions.length === 1 ? 'question' : 'questions'}`,formatDate(paper.testDate)].filter(Boolean).join(' · ')}
            >
              <StatusBadge status={paper.status} />
              {paper.status === 'published' && (
                <button className="btn btn-secondary" onClick={() => setStatus('close')}>Close submissions</button>
              )}
              {paper.status === 'closed' && (
                <button className="btn btn-secondary" onClick={() => setStatus('reopen')}>Reopen submissions</button>
              )}
            </PageHead>
            <ErrorAlert message={error} />

            <div className="stack">
              <Loader query={statsQuery}>
                {({ summary, questions, topics }) => (
                  <>
                    <div className="grid grid-stats">
                      <Stat icon={Users} value={`${summary.submitted}/${summary.classSize}`} label="Students submitted" />
                      <Stat icon={Percent} value={`${summary.average}%`} label="Average score" />
                      <Stat icon={TrendingUp} value={`${summary.highest}%`} label="Highest" />
                      <Stat icon={TrendingDown} value={`${summary.lowest}%`} label="Lowest" />
                    </div>

                    {summary.submitted > 0 && (
                      <div className="grid grid-2">
                        <div className="card">
                          <div className="card-head">
                            <h2>Accuracy by topic</h2>
                            <span className="muted small">Weakest first</span>
                          </div>
                          {topics.length === 0 ? (
                            <p className="muted">No questions on this paper are linked to a topic.</p>
                          ) : (
                            topics.map((topic) => (
                              <Meter key={topic.topicId} label={topic.name} hint={`${topic.attempted} answers`} value={topic.accuracy} tone={scoreTone(topic.accuracy)} />
                            ))
                          )}
                        </div>

                        <div className="card">
                          <div className="card-head">
                            <h2>Accuracy by question</h2>
                            <span className="muted small">Correct answer in brackets</span>
                          </div>
                          {questions.map((question) => (
                            <Meter
                              key={question.number}
                              label={`Q${question.number} (${LETTERS[question.correctOption]}) ${question.text}`}
                              value={question.accuracy}
                              tone={scoreTone(question.accuracy)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Loader>

              <div className="card">
                <div className="card-head">
                  <h2>Student marks</h2>
                </div>
                <Loader query={submissionsQuery}>
                  {({ submissions }) =>
                    submissions.length === 0 ? (
                      <Empty icon={ClipboardList} title="No submissions yet">
                        Marks appear here as students upload their answer sheets.
                      </Empty>
                    ) : (
                      <div className="table-wrap">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Student</th>
                              <th className="num">Marks</th>
                              <th className="num">Score</th>
                              <th>Submitted</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((submission) => (
                              <tr key={submission._id}>
                                <td>
                                  <div className="row">
                                    <Avatar user={submission.student} size={32} />
                                    <span style={{ fontWeight: 600 }}>{submission.student?.name || 'Removed student'}</span>
                                    {submission.reviewedByTeacher && <span className="badge badge-gray">Corrected</span>}
                                  </div>
                                </td>
                                <td className="num">{submission.score}/{submission.total}</td>
                                <td className="num"><ScoreBadge percentage={submission.percentage} /></td>
                                <td className="muted">{formatDate(submission.createdAt)}</td>
                                <td className="num">
                                  <Link className="btn btn-secondary btn-sm" to={`/app/submissions/${submission._id}`}>Review</Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  }
                </Loader>
              </div>
            </div>
          </>
        )}
      </Loader>
    </div>
  );
}
