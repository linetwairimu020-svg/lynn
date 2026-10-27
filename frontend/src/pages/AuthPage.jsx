import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Login from './Login';
import Register from './Register';

export default function AuthPage() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isRegister = pathname === '/register';

  if (loading) return <main className="container py-5" role="status">Checking your sign-in…</main>;
  if (user) return <Navigate to="/account" replace />;

  return <div className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
    <header className="register-header">
      <div className="register-header-inner">
        <Link className="register-logo" to="/" aria-label="Linet Wairimu home">LW</Link>
        {isRegister && <p className="register-header-note">Already have an account? <Link to="/login">Log in</Link></p>}
      </div>
    </header>
    <main className="register-main">
      {isRegister ? <section className="auth-card register-card" aria-labelledby="register-heading">
        <Register />
      </section> : <section className="auth-card register-card" aria-labelledby="login-heading">
        <Login embedded />
      </section>}
    </main>
  </div>;
}
