import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import portraitImage from '../../assets/Intense Braided Bun Studio Portrait.png';
import profile from '../data/profile';
import useAuth from '../hooks/useAuth';
import Login from './Login';
import Register from './Register';

function UserProfilePreview() {
  return <article className="register-preview-card profile-preview-card" aria-labelledby="profile-preview-heading">
    <div className="preview-card-heading">
      <div><p className="preview-overline">01 / Your account</p><h2 id="profile-preview-heading">User Profile Preview</h2></div>
      <span className="preview-label">Example</span>
    </div>
    <div className="profile-preview-person">
      <img src={portraitImage} alt={`Portrait of ${profile.name}`} />
      <div className="profile-preview-identity">
        <span className="preview-overline">Personal profile</span>
        <h3>{profile.name}</h3>
        <p>{profile.headline}</p>
        <span className="profile-preview-location"><i className="bi bi-geo-alt" aria-hidden="true" />{profile.location}</span>
      </div>
    </div>
    <dl className="profile-preview-metrics">
      <div><dt>Last login</dt><dd>After first sign-in</dd></div>
      <div><dt>Active since</dt><dd>Account creation</dd></div>
      <div><dt>Total connected time</dt><dd>00h 00m</dd></div>
    </dl>
    <div className="integration-preview-status">
      <span><i className="bi bi-plug" aria-hidden="true" />Active Integration Status</span>
      <strong><i aria-hidden="true" />Ready to connect</strong>
    </div>
  </article>;
}

function UserPreferencesPreview() {
  const [preferences, setPreferences] = useState({ Email: true, SMS: false, 'Push notifications': true });
  const communication = [
    ['Email', 'bi-envelope'],
    ['SMS', 'bi-chat-dots'],
    ['Push notifications', 'bi-bell'],
  ];

  return <article className="register-preview-card preferences-preview-card" aria-labelledby="preferences-preview-heading">
    <div className="preview-card-heading">
      <div><p className="preview-overline">02 / Your workspace</p><h2 id="preferences-preview-heading">User Preferences</h2></div>
      <i className="bi bi-sliders2 preview-heading-icon" aria-hidden="true" />
    </div>
    <div className="preference-location-grid">
      <div><span>Language</span><strong><i className="bi bi-translate" aria-hidden="true" />English</strong></div>
      <div><span>Region</span><strong><i className="bi bi-globe2" aria-hidden="true" />Kenya</strong></div>
    </div>
    <div className="preference-timezone"><span>Timezone</span><strong>Africa/Nairobi <small>UTC +03:00</small></strong></div>
    <div className="communication-preview">
      <div className="communication-preview-heading"><h3>Communication preferences</h3><span>Preview defaults</span></div>
      {communication.map(([label, icon]) => <div className="communication-preview-row" key={label}>
        <span className="communication-channel"><i className={`bi ${icon}`} aria-hidden="true" />{label}</span>
        <button
          className={`preview-switch ${preferences[label] ? 'is-on' : ''}`}
          type="button"
          role="switch"
          aria-label={`${label} notifications`}
          aria-checked={preferences[label]}
          onClick={() => setPreferences((current) => ({ ...current, [label]: !current[label] }))}
        ><i /></button>
      </div>)}
    </div>
    <div className="security-preview">
      <div className="security-preview-heading"><span><i className="bi bi-shield-lock" aria-hidden="true" />Security level</span><strong>Strong</strong></div>
      <div className="security-strength-meter" role="img" aria-label="Security strength: strong">
        <i /><i /><i /><i />
      </div>
    </div>
    <div className="connected-services-preview">
      <div className="connected-services-heading"><h3>Connected services</h3><span>After signup</span></div>
      <div className="connected-service-list" aria-label="Available service integrations">
        <span title="Google"><i className="bi bi-google" aria-hidden="true" /><small>Google</small></span>
        <span title="GitHub"><i className="bi bi-github" aria-hidden="true" /><small>GitHub</small></span>
        <span title="Calendar"><i className="bi bi-calendar3" aria-hidden="true" /><small>Calendar</small></span>
      </div>
    </div>
  </article>;
}

export default function AuthPage() {
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const isRegister = pathname === '/register';
  const [isDevelopmentMode] = useState(true);

  if (loading) return <main className="container py-5" role="status">Checking your sign-in…</main>;
  if (user) return <Navigate to="/account" replace />;

  return <div className={`auth-page ${isRegister ? 'register-page' : 'login-page'}`}>
    <header className="register-header">
      <div className="register-header-inner">
        <Link className="register-logo" to="/" aria-label="Linet Wairimu home">LW</Link>
        {isRegister && <p className="register-header-note">Already have an account? <Link to="/login">Log in</Link></p>}
      </div>
    </header>
    <main className={`register-main${isRegister ? ' register-main-with-preview' : ''}`}>
      {isRegister ? <div className="register-layout">
        <section className="auth-card register-card" aria-labelledby="register-heading">
          <p className="register-prototype-badge"><i className="bi bi-stars" aria-hidden="true" />A thoughtful start</p>
          <Register isDevelopmentMode={isDevelopmentMode} />
        </section>
        <aside className="register-preview-column" aria-label="Account preview">
          <div className="register-preview-intro"><p className="register-kicker">Your space, your way</p><h2>A clearer view of what’s ahead.</h2><p>A quick look at the profile and preferences you can shape after joining.</p></div>
          <UserProfilePreview />
          <UserPreferencesPreview />
        </aside>
      </div> : <section className="auth-card register-card" aria-labelledby="login-heading">
        <Login embedded isDevelopmentMode={isDevelopmentMode} />
      </section>}
    </main>
  </div>;
}
