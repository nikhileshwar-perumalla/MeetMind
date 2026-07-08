import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OAuthCallback from './pages/OAuthCallback';
import DashboardPage from './pages/DashboardPage';
import NewMeetingPage from './pages/NewMeetingPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import SearchPage from './pages/SearchPage';
import WorkspacePage from './pages/WorkspacePage';

function Protected({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/meetings/new" element={<NewMeetingPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
