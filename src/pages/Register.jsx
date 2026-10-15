import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { register } from '../services/authService';

export default function Register({ embedded = false }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    const password = form.elements.password.value;
    const confirmation = form.elements.confirmPassword.value;
    if (password !== confirmation) {
      setMessage({ kind: 'error', text: 'The passwords do not match.' });
      form.elements.confirmPassword.focus();
      return;
    }
    setSubmitting(true);
    setMessage({ kind: '', text: '' });
    try {
      await register({ name: form.elements.name.value.trim(), email: form.elements.email.value, password });
      form.reset();
      navigate('/login', { replace: true, state: { registrationSuccess: true } });
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const content = <>
    <p className="eyebrow"><span /> Account access</p><h1 className="h2 serif-title">Create an account.</h1><p className="text-secondary">Create a standard account with a securely hashed password.</p>
    <form onSubmit={handleSubmit}>
      <div className="mb-3"><label className="form-label" htmlFor="register-name">Full name</label><input className="form-control" id="register-name" name="name" autoComplete="name" required maxLength="120" /></div>
      <div className="mb-3"><label className="form-label" htmlFor="register-email">Email address</label><input className="form-control" id="register-email" name="email" type="email" autoComplete="email" required /></div>
      <div className="mb-3"><label className="form-label" htmlFor="register-password">Password</label><div className="input-group"><input className="form-control" id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="12" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,}" title="Use at least 12 characters with uppercase and lowercase letters and a number." aria-describedby="password-requirements" required /><button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}><i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" /></button></div><small id="password-requirements" className="form-text">At least 12 characters, including uppercase, lowercase, and a number.</small></div>
      <div className="mb-4"><label className="form-label" htmlFor="register-confirm-password">Confirm password</label><input className="form-control" id="register-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" required /></div>
      <button className="btn btn-primary w-100" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Create account'}</button>
      {message.text && <p className={`alert ${message.kind === 'success' ? 'alert-success' : 'alert-warning'} mt-3 mb-0`} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
    </form>
    <p className="small mt-3 mb-0">Already registered? <Link to="/login">Login here</Link></p>
  </>;

  if (embedded) return content;
  return <div className="portfolio-page auth-page"><Navbar links={[{ label: 'Home', href: '/' }]} /><main className="container py-6"><div className="auth-card mx-auto">{content}</div></main><Footer /></div>;
}
