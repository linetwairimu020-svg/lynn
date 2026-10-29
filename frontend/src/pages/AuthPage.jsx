import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Login from './Login';
import Register from './Register';
import loginLogo from '../../assets/LW-logo.png';

export default function AuthPage() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isRegister = pathname === '/register';

  if (loading) return <main className="container py-5" role="status">Checking your sign-in…</main>;
  if (user) return <Navigate to="/account" replace />;

  if (!isRegister) {
    return <div className="auth-page login-page">
      <header className="login-header">
        <Link to="/" className="login-back-link"><i className="bi bi-arrow-left" aria-hidden="true" /> Back to Portfolio</Link>
      </header>
      <main className="login-main">
        <section className="login-brand-panel" aria-label="Linet Wairimu portfolio administration">
          <div className="login-brand-message">
            <img className="login-network-image" src={loginLogo} alt="LW" />
            <p className="login-brand-tagline">Create with grace. Build your place.</p>
            <p className="login-brand-caption">Portfolio admin.</p>
          </div>
          <span className="login-brand-orbit login-brand-orbit-one" />
          <span className="login-brand-orbit login-brand-orbit-two" />
        </section>
        <section className="login-content-panel" aria-label="Sign in">
          <div className="login-layout">
            <section className="auth-card register-card login-card" aria-labelledby="login-heading">
              <img className="login-card-logo" src={loginLogo} alt="LW" />
              <Login embedded />
            </section>
          </div>
        </section>
      </main>
    </div>;
  }

  return <div className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
    <header className="register-header">
      <div className="register-header-inner">
        <Link className="register-logo" to="/" aria-label="Linet Wairimu home"><img src={loginLogo} alt="LW" /></Link>
        <p className="register-header-note">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </header>
    <main className="register-main">
      <section className="auth-card register-card" aria-labelledby="register-heading">
        <Register />
      </section>
    </main>
  </div>;
}
