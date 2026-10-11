import { Lightbulb, Target } from 'lucide-react';
import { useApi } from '../api/useApi.js';
import { Empty, Loader, PageHead } from '../components/ui.jsx';

function tone(topic) {
  if (!topic.isWeak) return 'green';
  return topic.errorRate >= 60 ? 'red' : 'amber';
}

export default function WeakTopics() {
  const query = useApi('/analytics/me');

  return (
    <div className="page page-narrow">
      <PageHead title="My weak topics" subtitle="Based on every answer sheet you have submitted. Recent papers count more." />

      <Loader query={query}>
        {({ topics, studyPlan, summary }) =>
          topics.length === 0 ? (
            <div className="card">
              <Empty icon={Target} title="Nothing to show yet">
                {summary.papers
                  ? 'Your papers so far have no questions linked to syllabus topics.'
                  : 'Submit your first answer sheet and your weak topics will appear here.'}
              </Empty>
            </div>
          ) : (
            <div className="stack">
              <div className="theory" style={{ marginTop: 0 }}>
                <div className="theory-title"><Lightbulb size={16} /> Your study plan</div>
                {studyPlan}
              </div>

              {topics.map((topic) => {
                const t = tone(topic);
                return (
                  <div className="card" key={topic.topicId}>
                    <div className="row row-wrap">
                      <div className="list-main">
                        <h2>{topic.name}</h2>
                        <div className="muted small">{topic.className} · {topic.wrong} of {topic.attempted} answers wrong</div>
                      </div>
                      {topic.isWeak ? (
                        <span className={`badge badge-${t}`}>Needs revision</span>
                      ) : topic.attempted < 3 ? (
                        <span className="badge badge-gray">Not enough answers yet</span>
                      ) : (
                        <span className="badge">On track</span>
                      )}
                    </div>

                    <div className="row" style={{ marginTop: 12 }}>
                      <div className={`bar spacer ${t === 'green' ? '' : t}`}>
                        <span style={{ width: `${topic.errorRate}%` }} />
                      </div>
                      <strong style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{topic.errorRate}% wrong</strong>
                    </div>

                    {topic.isWeak && topic.theory && (
                      <div className="theory">
                        <div className="theory-title"><Lightbulb size={16} /> Theory to revise</div>
                        <span className="pre-line">{topic.theory}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        }
      </Loader>
    </div>
  );
}
