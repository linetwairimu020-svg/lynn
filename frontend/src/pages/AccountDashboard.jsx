import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import useAuth from '../hooks/useAuth';
import { logout } from '../services/authService';
import { apiService } from '../services/apiService';

const communicationOptions = [
  ['email', 'Email', 'bi-envelope'],
  ['sms', 'SMS', 'bi-chat-dots'],
  ['push', 'Push notifications', 'bi-bell'],
];

const connectedProviders = [
  ['google', 'Google', 'bi-google'],
  ['github', 'GitHub', 'bi-github'],
  ['calendar', 'Calendar', 'bi-calendar3'],
];

function formatDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return 'Not available';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatDuration(startedAt, now) {
  const start = Date.parse(startedAt);
  if (!Number.isFinite(start)) return '—';
  const totalMinutes = Math.max(0, Math.floor((now - start) / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m`;
}

export default function AccountDashboard() {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  const [preferences, setPreferences] = useState(user.preferences);
  const [regionDraft, setRegionDraft] = useState(user.preferences.region);
  const [timezoneDraft, setTimezoneDraft] = useState(user.preferences.timezone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const initials = [user.firstName, user.lastName].filter(Boolean).map((name) => name[0]).join('').toUpperCase();

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const savePreference = async (changes) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await apiService.user.updatePreferences(changes);
      setPreferences(result.user.preferences);
      setRegionDraft(result.user.preferences.region);
      setTimezoneDraft(result.user.preferences.timezone);
      setMessage('Your preferences have been saved.');
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const persistRegion = () => {
    if (regionDraft !== preferences.region) void savePreference({ region: regionDraft });
  };

  const persistTimezone = () => {
    if (timezoneDraft !== preferences.timezone) void savePreference({ timezone: timezoneDraft });
  };

  const changeCommunication = (key, checked) => {
    void savePreference({ [key]: checked });
  };

  const handleLogout = async () => {
    setError('');
    try {
      await logout();
    } catch (logoutError) {
      setError(logoutError.message);
    }
  };

  const integrationProviders = new Set(user.integrations.map(({ provider }) => provider));
  const activeIntegrations = connectedProviders.filter(([provider]) => integrationProviders.has(provider));

  return <div className="account-page">
    <Navbar links={[{ label: 'Home', href: '/' }, { label: 'My Account', to: '/account' }]} />
    <main className="container py-5">
      <div className="account-heading">
        <div><p className="eyebrow"><span /> Your workspace</p><h1 className="h2 serif-title">Account dashboard</h1><p className="text-secondary">Your profile, session, and saved preferences.</p></div>
        <button className="btn btn-outline-dark" type="button" onClick={() => void handleLogout()}>Sign out</button>
      </div>
      {(error || message) && <p className={`alert ${error ? 'alert-warning' : 'alert-success'}`} role={error ? 'alert' : 'status'}>{error || message}</p>}
      <div className="account-grid">
        <article className="register-preview-card profile-preview-card" aria-labelledby="account-profile-heading">
          <div className="preview-card-heading"><div><p className="preview-overline">01 / Your account</p><h2 id="account-profile-heading">User Profile</h2></div><span className="preview-label">{user.role === 'admin' ? 'Administrator' : 'Member'}</span></div>
          <div className="profile-preview-person">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={`Portrait of ${user.name}`} />
              : <div className="account-avatar" aria-label={`${user.name} initials`}>{initials || '?'}</div>}
            <div className="profile-preview-identity"><span className="preview-overline">Personal profile</span><h3>{user.firstName} {user.lastName}</h3><p>{user.email}</p><span className="profile-preview-location"><i className="bi bi-geo-alt" aria-hidden="true" />{user.location || preferences.region || 'Location not set'}</span></div>
          </div>
          <dl className="profile-preview-metrics">
            <div><dt>Last login</dt><dd><time dateTime={user.lastLoginAt || undefined}>{formatDate(user.lastLoginAt)}</time></dd></div>
            <div><dt>Active since</dt><dd><time dateTime={user.createdAt}>{formatDate(user.createdAt)}</time></dd></div>
            <div><dt>Total connected time</dt><dd>{formatDuration(user.sessionStartedAt, now)}</dd></div>
          </dl>
          <div className="integration-preview-status"><span><i className="bi bi-plug" aria-hidden="true" />Active Integration Status</span><strong className={activeIntegrations.length ? '' : 'is-disconnected'}><i aria-hidden="true" />{activeIntegrations.length ? `${activeIntegrations.length} connected` : 'No integrations connected'}</strong></div>
        </article>

        <article className="register-preview-card preferences-preview-card" aria-labelledby="account-preferences-heading">
          <div className="preview-card-heading"><div><p className="preview-overline">02 / Your workspace</p><h2 id="account-preferences-heading">User Preferences</h2></div><i className="bi bi-sliders2 preview-heading-icon" aria-hidden="true" /></div>
          <div className="account-preference-fields">
            <label htmlFor="account-region">Region</label>
            <input id="account-region" className="form-control form-control-sm" value={regionDraft} maxLength={100} placeholder="Add your region" onChange={(event) => setRegionDraft(event.target.value)} onBlur={persistRegion} disabled={saving} />
            <label htmlFor="account-timezone">Timezone</label>
            <input id="account-timezone" className="form-control form-control-sm" value={timezoneDraft} maxLength={100} placeholder="UTC or an IANA timezone" onChange={(event) => setTimezoneDraft(event.target.value)} onBlur={persistTimezone} disabled={saving} />
          </div>
          <div className="communication-preview">
            <div className="communication-preview-heading"><h3>Communication preferences</h3><span>{saving ? 'Saving…' : 'Saved to your account'}</span></div>
            {communicationOptions.map(([key, label, icon]) => <div className="communication-preview-row" key={key}>
              <span className="communication-channel"><i className={`bi ${icon}`} aria-hidden="true" />{label}</span>
              <button className={`preview-switch ${preferences[key] ? 'is-on' : ''}`} type="button" role="switch" aria-label={`${label} notifications`} aria-checked={preferences[key]} onClick={() => changeCommunication(key, !preferences[key])} disabled={saving}><i /></button>
            </div>)}
          </div>
          <div className="connected-services-preview">
            <div className="connected-services-heading"><h3>Connected services</h3><span>{activeIntegrations.length ? 'Connected to your account' : 'Not connected'}</span></div>
            <div className="connected-service-list" aria-label="Integration connection status">
              {connectedProviders.map(([provider, label, icon]) => <span title={`${label}: ${integrationProviders.has(provider) ? 'connected' : 'not connected'}`} key={provider}><i className={`bi ${icon}`} aria-hidden="true" /><small>{label}{integrationProviders.has(provider) ? ' · Active' : ''}</small></span>)}
            </div>
          </div>
        </article>
      </div>
      <p className="account-back-link"><Link to="/">Back to the portfolio</Link></p>
    </main>
    <Footer />
  </div>;
}
