import { useState } from 'react';
import { Link } from 'react-router-dom';
import PhoneInputModule from 'react-phone-input-2';
import { isBackendUnavailable, register } from '../services/authService';

const PhoneInput = PhoneInputModule.default;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}$/;

export default function Register({ isDevelopmentMode = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [registeredName, setRegisteredName] = useState('');
  const [prototypeRegistration, setPrototypeRegistration] = useState(false);

  const visibilityIcon = (visible) => (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      {visible
        ? <><path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4Z" /><circle cx="8" cy="8" r="2" /><path d="m3 13 10-10" /></>
        : <><path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4Z" /><circle cx="8" cy="8" r="2" /></>}
    </svg>
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const form = event.currentTarget;
    if (password !== confirmation) {
      setMessage({ kind: 'error', text: 'The passwords do not match.' });
      form.elements.confirmPassword.focus();
      return;
    }
    setSubmitting(true);
    setMessage({ kind: '', text: '' });
    try {
      const name = [firstName, lastName].map((part) => part.trim()).filter(Boolean).join(' ');
      try {
        await register({ name, email: email.trim(), phone: phone.trim(), password });
        setPrototypeRegistration(false);
      } catch (error) {
        if (!isDevelopmentMode || !isBackendUnavailable(error)) throw error;
        setPrototypeRegistration(true);
      }
      setRegisteredName(name);
      form.reset();
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmation('');
    } catch (error) {
      setMessage({ kind: 'error', text: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return registeredName ? <>
    <div className="auth-success">
      <span className="auth-success-icon" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3.2 3.2L13 4.5" /></svg></span>
      <p className="register-kicker">You’re all set</p>
      <h1 className="h2 serif-title" id="register-heading">Welcome, {registeredName}.</h1>
      <p className="register-description" role="status">
        {prototypeRegistration
          ? 'Prototype Mode: Backend server is currently offline. Frontend validation successful! No account was created.'
          : 'Your account has been created. You can now sign in and continue exploring.'}
      </p>
      <div className="d-grid gap-2">
        <Link className="btn register-submit" to="/login">Continue to login</Link>
        <Link className="btn register-secondary-action" to="/#work">Explore my projects</Link>
      </div>
    </div>
  </> : <>
    <p className="register-kicker">Account access</p>
    <h1 className="register-title" id="register-heading">Register a New Account.</h1>
    <p className="register-description">Create your account and stay connected.</p>
    <form className="register-form" onSubmit={handleSubmit}>
      <div className="register-name-fields">
        <div className="register-field">
          <label htmlFor="register-first-name">First Name</label>
          <input id="register-first-name" name="firstName" autoComplete="given-name" placeholder="e.g. Linet" value={firstName} onChange={(event) => setFirstName(event.target.value)} required maxLength="59" />
        </div>
        <div className="register-field">
          <label htmlFor="register-last-name">Last Name</label>
          <input id="register-last-name" name="lastName" autoComplete="family-name" placeholder="e.g. Wairimu" value={lastName} onChange={(event) => setLastName(event.target.value)} required maxLength="59" />
        </div>
      </div>
      <div className="register-field">
        <label htmlFor="register-email">Email address</label>
        <input id="register-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength="254" aria-describedby="register-email-feedback" />
        <small id="register-email-feedback" className={email && !emailPattern.test(email) ? 'is-invalid' : email ? 'is-valid' : ''} aria-live="polite">
          {email && !emailPattern.test(email) ? 'Enter a valid email address.' : email ? 'Email looks good.' : 'Use an email address you can access.'}
        </small>
      </div>
      <div className="register-field">
        <label htmlFor="register-phone">Phone Number <span>(Optional)</span></label>
        <PhoneInput
          country="ke"
          preferredCountries={['ke', 'us', 'gb']}
          enableSearch
          disableSearchIcon
          countryCodeEditable={false}
          searchPlaceholder="Search countries"
          searchNotFound="No countries found"
          placeholder="+254 712 345 678"
          value={phone}
          onChange={(value, country) => {
            const dialCode = 'dialCode' in country ? country.dialCode : '';
            setPhone(value && value !== dialCode ? `+${value}` : '');
          }}
          containerClass="register-phone-input"
          inputClass="register-phone-control"
          buttonClass="register-phone-button"
          dropdownClass="register-phone-dropdown"
          searchClass="register-phone-search"
          inputProps={{
            id: 'register-phone',
            name: 'phone',
            autoComplete: 'tel',
            'aria-label': 'Phone Number (Optional)',
          }}
        />
      </div>
      <div className="register-field">
        <label htmlFor="register-password">Password</label>
        <div className="register-password-input">
          <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength="12" maxLength="128" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}" title="Use 12 to 128 characters with uppercase and lowercase letters and a number." aria-describedby="password-requirements" placeholder="Create a strong password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className="auth-visibility-toggle" type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{visibilityIcon(showPassword)}</button>
        </div>
        <small id="password-requirements" className={password ? (passwordPattern.test(password) ? 'is-valid' : 'is-invalid') : ''} aria-live="polite">
          {password ? (passwordPattern.test(password) ? 'Strong password.' : 'Weak password — use 12+ characters with uppercase, lowercase, and a number.') : 'Use 12+ characters, including uppercase, lowercase, and a number.'}
        </small>
      </div>
      <div className="register-field">
        <label htmlFor="register-confirm-password">Confirm Password</label>
        <input id="register-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="Enter your password again" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required aria-describedby="confirm-password-feedback" />
        <small id="confirm-password-feedback" className={confirmation ? (password === confirmation ? 'is-valid' : 'is-invalid') : ''} aria-live="polite">
          {confirmation ? (password === confirmation ? 'Passwords match.' : 'Passwords do not match yet.') : 'Re-enter your password to confirm.'}
        </small>
      </div>
      <button className="register-submit" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Register'}</button>
      {message.text && <p className="register-error" role="alert">{message.text}</p>}
    </form>
    <p className="register-login-prompt">Already have an account? <Link to="/login">Log in</Link></p>
  </>;
}
