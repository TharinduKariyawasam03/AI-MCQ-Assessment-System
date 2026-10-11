import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import { Spinner } from './components/ui.jsx';
import { useAuth } from './context/AuthContext.jsx';
import ClassDetail from './pages/ClassDetail.jsx';
import Classes from './pages/Classes.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import PaperEditor from './pages/PaperEditor.jsx';
import PaperResults from './pages/PaperResults.jsx';
import Profile from './pages/Profile.jsx';
import Register from './pages/Register.jsx';
import Result from './pages/Result.jsx';
import SubmitSheet from './pages/SubmitSheet.jsx';
import WeakTopics from './pages/WeakTopics.jsx';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/app" replace />;
  return children;
}

function Only({ role, children }) {
  const { user } = useAuth();
  if (user.role !== role) return <Navigate to="/app" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

      <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Dashboard />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="classes/:classId/papers/new" element={<Only role="teacher"><PaperEditor /></Only>} />
        <Route path="papers/:paperId/edit" element={<Only role="teacher"><PaperEditor /></Only>} />
        <Route path="papers/:id/results" element={<Only role="teacher"><PaperResults /></Only>} />
        <Route path="papers/:id/submit" element={<Only role="student"><SubmitSheet /></Only>} />
        <Route path="submissions/:id" element={<Result />} />
        <Route path="weak-topics" element={<Only role="student"><WeakTopics /></Only>} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
