import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function AccountRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main className="container py-5" role="status">Checking your sign-in…</main>;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}
