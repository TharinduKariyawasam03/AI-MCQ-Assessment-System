import { BookOpenCheck, Camera, CheckCircle2, GraduationCap, Lightbulb, Target, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const STEPS = [
  { title: 'Teacher adds the paper', text: 'Enter each question with its options and the correct answer. Every question is linked to a syllabus topic.' },
  { title: 'Students sit the test on paper', text: 'Run the MCQ test in class as usual. Nothing changes in the exam hall.' },
  { title: 'Students upload their sheet', text: 'A photo of the answer sheet is all it takes. The sheet is marked against the answer key in seconds.' },
  { title: 'Everyone sees what to fix', text: 'Students get the theory behind each wrong answer. Teachers see which topics the class finds hardest.' },
];

const FEATURES = [
  { icon: Camera, title: 'Marks from a photo', text: 'No more marking 100 sheets by hand after every class test.' },
  { icon: Lightbulb, title: 'Theory for every mistake', text: 'Each wrong answer shows the correct option and the theory note for its topic.' },
  { icon: Target, title: 'Weak topic prediction', text: 'Past answer sheets reveal the topics a student keeps getting wrong.' },
  { icon: BookOpenCheck, title: 'Built for tuition classes', text: 'Class join codes, a syllabus per class, and results for the whole batch.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <div className="row">
          {user ? (
            <Link className="btn" to="/app">Open dashboard</Link>
          ) : (
            <>
              <Link className="btn btn-ghost" to="/login">Log in</Link>
              <Link className="btn" to="/register">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <span className="badge">For tuition teachers and students</span>
            <h1 style={{ marginTop: 16 }}>
              Mark MCQ papers in seconds. <em>Know what to revise.</em>
            </h1>
            <p>
              My Teacher marks answer sheets from a photo and shows every student the theory behind the
              questions they got wrong.
            </p>
            <div className="row row-wrap">
              <Link className="btn btn-lg" to="/register?role=teacher">
                <GraduationCap size={20} /> I am a teacher
              </Link>
              <Link className="btn btn-lg btn-secondary" to="/register?role=student">
                I am a student
              </Link>
            </div>
          </div>

          <div className="hero-card" aria-hidden="true">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div className="muted small">Term Test 2</div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>Your result</div>
              </div>
              <div className="score-ring" style={{ '--pct': 80, width: 84, height: 84 }}>
                <div style={{ width: 64, height: 64, fontSize: 18 }}>80%</div>
              </div>
            </div>
            <div className="review-option correct">
              <CheckCircle2 size={18} color="#16a34a" /> Q5. Power in a resistor
            </div>
            <div className="review-option chosen-wrong">
              <XCircle size={18} color="#dc2626" /> Q6. Resistors in series
            </div>
            <div className="theory">
              <div className="theory-title">
                <Lightbulb size={16} /> Revise: Electricity
              </div>
              Resistors in series add up: R = R1 + R2 + R3.
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">How it works</h2>
        <p className="section-sub">From the exam hall to a personal revision plan in four steps.</p>
        <div className="grid grid-cards">
          {STEPS.map((step, index) => (
            <div className="card" key={step.title}>
              <span className="step-num">{index + 1}</span>
              <h3>{step.title}</h3>
              <p className="muted" style={{ marginTop: 6 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="grid grid-cards">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div className="card" key={title}>
              <span className="stat-icon"><Icon size={18} /></span>
              <h3>{title}</h3>
              <p className="muted" style={{ marginTop: 6 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">My Teacher · Smarter marking for tuition classes</footer>
    </div>
  );
}
