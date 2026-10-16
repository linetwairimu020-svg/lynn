import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import { login } from '../services/authService';

function safeRedirect(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/';
  try {
    const target = new URL(value, window.location.origin);
    return target.origin === window.location.origin ? `${target.pathname}${target.search}${target.hash}` : '/';
  } catch {
    return '/';
  }
}

export default function Login({ embedded = false }) {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const redirectTo = safeRedirect(searchParams.get('next'));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    const form = event.currentTarget;
    try {
      await login({ email: form.elements.email.value, password: form.elements.password.value });
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const content = <>
    <p className="eyebrow"><span /> Account access</p><h1 className="h2 serif-title">Welcome back.</h1><p className="text-secondary">Sign in with your account to continue.</p>
    {location.state?.registrationSuccess && <p className="alert alert-success" role="status">Your account has been created. You can now log in.</p>}
    {auth.error && <p className="alert alert-warning" role="alert">The authentication service could not be reached: {auth.error}</p>}
    <form onSubmit={handleSubmit}>
      <div className="mb-3"><label className="form-label" htmlFor="login-email">Email address</label><input className="form-control" id="login-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="mb-3"><label className="form-label" htmlFor="login-password">Password</label><div className="input-group"><input className="form-control" id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /><button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}><i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" /></button></div></div>
      <button className="btn btn-primary w-100" type="submit" disabled={submitting}>{submitting ? 'Signing in…' : 'Sign in'}</button>
      {error && <p className="alert alert-warning mt-3 mb-0" role="alert">{error}</p>}
    </form>
    <p className="small mt-3 mb-1"><button type="button" className="text-link" disabled title="Password reset becomes available when authentication is connected.">Forgot password? (unavailable)</button></p>
    <p className="small text-secondary">New here? <Link to="/register">Register here</Link></p>
  </>;

  if (embedded) return content;
  return <div className="portfolio-page auth-page"><Navbar links={[{ label: 'Home', href: '/' }]} /><main className="container py-6"><div className="auth-card mx-auto">{content}</div></main><Footer /></div>;
}
