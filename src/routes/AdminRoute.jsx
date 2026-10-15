import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { apiService } from '../services/apiService';
import { refreshCurrentUser } from '../services/authService';

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [authorization, setAuthorization] = useState({ userId: '', status: 'pending', error: '' });

  useEffect(() => {
    if (loading || !user || user.role !== 'admin') return undefined;
    let active = true;
    setAuthorization({ userId: user.id, status: 'pending', error: '' });
    apiService.admin.authorize()
      .then(() => {
        if (active) setAuthorization({ userId: user.id, status: 'allowed', error: '' });
      })
      .catch(async (error) => {
        if (!active) return;
        if (error.status === 401) {
          await refreshCurrentUser();
          return;
        }
        setAuthorization({ userId: user.id, status: 'denied', error: error.message });
      });
    return () => { active = false; };
  }, [loading, user]);

  if (loading) return <main className="container py-5" role="status">Checking your sign-in…</main>;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  if (user.role !== 'admin') {
    return <main className="container py-5"><h1 className="h2">Administrator access required</h1><p>Your account does not have permission to view this page.</p><Link to="/">Return to the portfolio</Link></main>;
  }
  if (authorization.userId !== user.id || authorization.status === 'pending') {
    return <main className="container py-5" role="status">Verifying administrator access…</main>;
  }
  if (authorization.status !== 'allowed') {
    return <main className="container py-5"><div className="alert alert-warning" role="alert">Administrator access could not be verified with the server: {authorization.error || 'Please sign in again.'}</div><Link to="/login">Return to sign in</Link></main>;
  }
  return children;
}
