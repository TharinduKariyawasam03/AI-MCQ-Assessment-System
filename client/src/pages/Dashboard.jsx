import { BookOpen, ClipboardCheck, ClipboardList, FileText, Lightbulb, Percent, Target, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApi } from '../api/useApi.js';
import { Avatar, Empty, Loader, Meter, PageHead, ScoreBadge, Stat, formatDate, scoreTone } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

function TeacherDashboard() {
  const query = useApi('/analytics/teacher');

  return (
    <Loader query={query}>
      {({ summary, recent }) => (
        <div className="stack">
          <div className="grid grid-stats">
            <Stat icon={BookOpen} value={summary.classes} label="Classes" />
            <Stat icon={Users} value={summary.students} label="Students" />
            <Stat icon={FileText} value={summary.papers} label="Papers" />
            <Stat icon={Percent} value={`${summary.average}%`} label="Average score" />
          </div>

          <div className="card">
            <div className="card-head">
              <h2>Latest submissions</h2>
              <Link to="/app/classes" className="small">All classes</Link>
            </div>
            {recent.length === 0 ? (
              <Empty icon={ClipboardList} title="No submissions yet">
                Create a class, publish a paper, and results will appear here as students upload their sheets.
                <br />
                <Link className="btn" to="/app/classes">Go to classes</Link>
              </Empty>
            ) : (
              <div className="list">
                {recent.map((submission) => (
                  <Link className="list-item" key={submission._id} to={`/app/submissions/${submission._id}`}>
                    <Avatar user={submission.student} />
                    <div className="list-main">
                      <div className="truncate" style={{ fontWeight: 600 }}>{submission.student?.name || 'Removed student'}</div>
                      <div className="muted small truncate">
                        {submission.paper?.title} · {formatDate(submission.createdAt)}
                      </div>
                    </div>
                    <span className="muted small">{submission.score}/{submission.total}</span>
                    <ScoreBadge percentage={submission.percentage} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Loader>
  );
}

function StudentDashboard() {
  const query = useApi('/analytics/me');

  return (
    <Loader query={query}>
      {({ summary, trend, topics, studyPlan }) => {
        const weak = topics.filter((topic) => topic.isWeak).slice(0, 4);
        const results = [...trend].reverse().slice(0, 6);

        return (
          <div className="stack">
            <div className="grid grid-stats">
              <Stat icon={BookOpen} value={summary.classes} label="Classes joined" />
              <Stat icon={ClipboardCheck} value={summary.papers} label="Papers marked" />
              <Stat icon={Percent} value={`${summary.average}%`} label="Average score" />
              <Stat icon={ClipboardList} value={summary.pending} label="Papers to submit" />
            </div>

            {summary.classes === 0 ? (
              <div className="card">
                <Empty icon={BookOpen} title="Join your first class">
                  Ask your teacher for the 6-character class code.
                  <br />
                  <Link className="btn" to="/app/classes">Join a class</Link>
                </Empty>
              </div>
            ) : (
              <>
                <div className="theory" style={{ marginTop: 0 }}>
                  <div className="theory-title"><Lightbulb size={16} /> Your study plan</div>
                  {studyPlan}
                </div>

                <div className="grid grid-2">
                  <div className="card">
                    <div className="card-head">
                      <h2>Topics to revise first</h2>
                      <Link to="/app/weak-topics" className="small">See all</Link>
                    </div>
                    {weak.length === 0 ? (
                      <p className="muted">
                        {topics.length ? 'No weak topics so far. Well done!' : 'Submit an answer sheet to see your weak topics.'}
                      </p>
                    ) : (
                      weak.map((topic) => (
                        <Meter
                          key={topic.topicId}
                          label={topic.name}
                          hint={`${topic.wrong} of ${topic.attempted} wrong`}
                          value={topic.errorRate}
                          tone={topic.errorRate >= 60 ? 'red' : 'amber'}
                        />
                      ))
                    )}
                  </div>

                  <div className="card">
                    <div className="card-head">
                      <h2>Recent results</h2>
                    </div>
                    {results.length === 0 ? (
                      <p className="muted">No results yet.</p>
                    ) : (
                      <div className="list">
                        {results.map((result) => (
                          <Link className="list-item" key={result.submissionId} to={`/app/submissions/${result.submissionId}`}>
                            <span className="stat-icon" style={{ margin: 0 }}><Target size={18} /></span>
                            <div className="list-main">
                              <div className="truncate" style={{ fontWeight: 600 }}>{result.title}</div>
                              <div className="bar" style={{ marginTop: 6 }}>
                                <span
                                  style={{
                                    width: `${result.percentage}%`,
                                    background: { green: undefined, amber: 'var(--amber-500)', red: 'var(--red-600)' }[scoreTone(result.percentage)],
                                  }}
                                />
                              </div>
                            </div>
                            <ScoreBadge percentage={result.percentage} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }}
    </Loader>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0];

  return (
    <div className="page">
      <PageHead
        title={`Hello, ${firstName}`}
        subtitle={user.role === 'teacher' ? 'Here is how your classes are doing.' : 'Here is how you are doing.'}
      />
      {user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard />}
    </div>
  );
}
