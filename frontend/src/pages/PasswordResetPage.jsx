import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { apiService } from '../services/apiService';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}$/;

export default function PasswordResetPage({ reset = false }) {
  const [searchParams] = useSearchParams();
  const [token] = useState(() => searchParams.get('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const isReset = reset || Boolean(token);

  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, '', window.location.pathname);
  }, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      if (isReset) {
        if (!token) throw new Error('This password reset link is invalid or has expired.');
        if (password !== confirmation) throw new Error('The passwords do not match.');
        const result = await apiService.auth.completePasswordReset(token, password);
        setMessage(result.message);
      } else {
        const result = await apiService.auth.requestPasswordReset(email.trim());
        setMessage(result.message);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="portfolio-page auth-page">
    <Navbar links={[{ label: 'Home', href: '/' }]} />
    <main className="container py-5">
      <section className="auth-card mx-auto" aria-labelledby="password-reset-heading">
        <p className="eyebrow"><span /> Account access</p>
        <h1 className="h2 serif-title" id="password-reset-heading">{isReset ? 'Choose a new password.' : 'Reset your password.'}</h1>
        <p className="text-secondary">{isReset ? 'Choose a strong password to secure your account.' : 'Enter the email address associated with your account. If it exists, we’ll send you a reset link.'}</p>
        {message
          ? <div className="alert alert-success" role="status">{message}</div>
          : <form onSubmit={handleSubmit}>
            {isReset ? <>
              <div className="mb-3">
                <label className="form-label" htmlFor="reset-password">New password</label>
                <input className="form-control" id="reset-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}" title="Use 12 to 128 characters with uppercase and lowercase letters and a number." value={password} onChange={(event) => setPassword(event.target.value)} required />
                <small className="form-text">Use 12–128 characters, including uppercase, lowercase, and a number.</small>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reset-confirm-password">Confirm new password</label>
                <input className="form-control" id="reset-confirm-password" type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
              </div>
            </> : <div className="mb-3">
              <label className="form-label" htmlFor="reset-email">Email address</label>
              <input className="form-control" id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} required />
            </div>}
            <button className="btn btn-primary w-100" type="submit" disabled={submitting || (isReset && !passwordPattern.test(password))}>{submitting ? 'Please wait…' : isReset ? 'Reset password' : 'Send reset link'}</button>
            {error && <p className="alert alert-warning mt-3 mb-0" role="alert">{error}</p>}
          </form>}
        <p className="small mt-3 mb-0"><Link to="/login">Return to sign in</Link></p>
      </section>
    </main>
    <Footer />
  </div>;
}
