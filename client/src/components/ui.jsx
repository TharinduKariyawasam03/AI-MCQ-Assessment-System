import { ArrowLeft, Check } from 'lucide-react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// green from 75%, amber from 40%, red below
export function scoreTone(percentage) {
  if (percentage >= 75) return 'green';
  if (percentage >= 40) return 'amber';
  return 'red';
}

export function Brand({ to = '/' }) {
  return (
    <Link to={to} className="brand">
      <span className="brand-mark">
        <Check size={20} strokeWidth={3} />
      </span>
      My Teacher
    </Link>
  );
}

export function Avatar({ user, size = 36 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (user?.avatarUrl) {
    return <img className="avatar" src={user.avatarUrl} alt="" style={style} />;
  }
  const initials = (user?.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <span className="avatar" style={{ ...style, background: user?.avatarColor || '#16a34a' }} aria-hidden="true">
      {initials}
    </span>
  );
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-error" role="alert">
      {message}
    </div>
  );
}

// Renders the spinner or the error for a useApi() result, otherwise its children.
export function Loader({ query, children }) {
  if (query.loading && !query.data) return <Spinner />;
  if (query.error) return <ErrorAlert message={query.error} />;
  if (!query.data) return null;
  return children(query.data);
}

export function PageHead({ title, subtitle, back, children }) {
  return (
    <>
      {back && (
        <Link to={back.to} className="back-link">
          <ArrowLeft size={15} /> {back.label}
        </Link>
      )}
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children && <div className="row row-wrap">{children}</div>}
      </div>
    </>
  );
}

export function Stat({ icon: Icon, value, label }) {
  return (
    <div className="card stat">
      <span className="stat-icon">
        <Icon size={18} />
      </span>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export function Empty({ icon: Icon, title, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <div>{children}</div>
    </div>
  );
}

export function Meter({ label, hint, value, tone = 'green' }) {
  return (
    <div className="meter">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="truncate">{label}</span>
        {hint && <span className="muted small">{hint}</span>}
      </div>
      <span className="meter-value">{value}%</span>
      <div className={`bar ${tone === 'green' ? '' : tone}`}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ScoreBadge({ percentage }) {
  const tone = scoreTone(percentage);
  return <span className={`badge ${tone === 'green' ? '' : `badge-${tone}`}`}>{percentage}%</span>;
}

export function StatusBadge({ status }) {
  const tone = { draft: 'badge-gray', published: '', closed: 'badge-amber' }[status];
  const label = { draft: 'Draft', published: 'Open', closed: 'Closed' }[status];
  return <span className={`badge ${tone}`}>{label}</span>;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <h2 style={{ marginBottom: 16 }}>{title}</h2>
        {children}
      </div>
    </div>
  );
}
