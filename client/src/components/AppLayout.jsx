import { BookOpen, LayoutDashboard, LogOut, Target, UserRound } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar, Brand } from './ui.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/app/classes', label: 'Classes', icon: BookOpen },
    ...(user.role === 'student' ? [{ to: '/app/weak-topics', label: 'Weak topics', icon: Target }] : []),
    { to: '/app/profile', label: 'Profile', icon: UserRound },
  ];

  const signOut = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <header className="mobile-bar">
        <Brand to="/app" />
        <button className="icon-btn" onClick={signOut} aria-label="Log out">
          <LogOut size={18} />
        </button>
      </header>

      <aside className="sidebar">
        <Brand to="/app" />
        <nav className="nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <Avatar user={user} />
          <div className="list-main">
            <div className="truncate" style={{ fontWeight: 600 }}>
              {user.name}
            </div>
            <div className="muted small" style={{ textTransform: 'capitalize' }}>
              {user.role}
            </div>
          </div>
          <button className="icon-btn" onClick={signOut} aria-label="Log out" title="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
