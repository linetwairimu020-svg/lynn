import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useContent from '../hooks/useContent';
import useAuth from '../hooks/useAuth';
import { logout } from '../services/authService';
import { apiService } from '../services/apiService';
import { notifyContentChanged } from '../services/contentEvents';
import { safeExternalUrl } from '../utils/urls';
import ContentOverviewChart from '../components/ContentOverviewChart';

const navigation = [
  ['Overview', 'overview', 'bi-grid'],
  ['Projects', 'projects', 'bi-kanban'],
  ['Services', 'services', 'bi-window'],
  ['Skills', 'skills', 'bi-lightning'],
  ['Profile', 'profile', 'bi-person'],
  ['Social links', 'social-links', 'bi-share'],
  ['Messages', 'messages', 'bi-envelope'],
  ['Settings', 'settings', 'bi-gear'],
];

const adminUrl = (section) => section === 'overview'
  ? '/?view=admin'
  : `/?view=admin&section=${encodeURIComponent(section)}`;

const schemas = {
  projects: {
    title: 'Projects',
    collection: 'projects',
    fields: [
      { name: 'title', label: 'Project name', required: true },
      { name: 'number', label: 'Display number' },
      { name: 'status', label: 'Status label', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'image', label: 'Image URL', type: 'url' },
      { name: 'technologies', label: 'Technologies (comma-separated)', type: 'list' },
      { name: 'route', label: 'Internal route (optional)' },
      { name: 'demoUrl', label: 'Live demo URL (optional)', type: 'url' },
      { name: 'repositoryUrl', label: 'Repository URL (optional)', type: 'url' },
      { name: 'comingSoon', label: 'Concept / in progress', type: 'checkbox' },
      { name: 'published', label: 'Published on portfolio', type: 'checkbox' },
    ],
  },
  services: {
    title: 'Services',
    collection: 'services',
    fields: [
      { name: 'title', label: 'Service name', required: true },
      { name: 'icon', label: 'Bootstrap Icon class' },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'published', label: 'Published on portfolio', type: 'checkbox' },
    ],
  },
  skills: {
    title: 'Skills',
    collection: 'skills',
    fields: [
      { name: 'name', label: 'Group name', required: true },
      { name: 'icon', label: 'Bootstrap Icon class' },
      { name: 'skills', label: 'Skills (comma-separated)', type: 'list' },
      { name: 'published', label: 'Published on portfolio', type: 'checkbox' },
    ],
  },
  'social-links': {
    title: 'Social links',
    collection: 'socialLinks',
    fields: [
      { name: 'platform', label: 'Platform identifier', required: true },
      { name: 'name', label: 'Displayed profile name', required: true },
      { name: 'url', label: 'Confirmed profile URL (leave blank until supplied)', type: 'url' },
      { name: 'icon', label: 'Bootstrap Icon class', required: true },
      { name: 'enabled', label: 'Show on portfolio', type: 'checkbox' },
    ],
  },
};

const objectSchemas = {
  profile: {
    title: 'Profile',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'headline', label: 'Headline', required: true },
      { name: 'summary', label: 'Intro summary', type: 'textarea', required: true },
      { name: 'about', label: 'About text', type: 'textarea', required: true },
      { name: 'location', label: 'Location' },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'phone', label: 'Phone' },
    ],
  },
  settings: {
    title: 'Site settings',
    fields: [
      { name: 'siteTitle', label: 'Browser title', required: true },
      { name: 'notice', label: 'Preview notice', required: true },
    ],
  },
};

const singular = (value) => value.endsWith('s') ? value.slice(0, -1) : value;
function newRecord(fields) {
  return fields.reduce((record, field) => {
    record[field.name] = field.type === 'checkbox' ? false : field.type === 'list' ? [] : '';
    return record;
  }, {});
}

function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiService.admin.overview()
      .then((result) => { if (active) setOverview(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <section><p className="eyebrow"><span /> Admin dashboard</p><h1 className="h2 serif-title">Content overview</h1><p className="text-secondary">Portfolio content and contact messages stored by the backend.</p>
    {error && <p className="alert alert-warning" role="alert">{error}</p>}
    {loading && <p className="text-secondary" role="status">Loading dashboard data…</p>}
    {!loading && !error && <ContentOverviewChart stats={overview?.counts} />}
    {overview?.recentActivity?.length > 0 && <section className="mt-4" aria-labelledby="recent-activity-heading"><h2 className="h5" id="recent-activity-heading">Recent activity</h2><ul className="list-group">{overview.recentActivity.map((activity) => <li className="list-group-item d-flex justify-content-between gap-3" key={`${activity.type}-${activity.id}`}><span>{activity.type === 'message' ? 'Received message' : `Updated ${activity.type}`}: {activity.label}</span><time className="small text-secondary" dateTime={activity.at}>{new Date(activity.at).toLocaleString()}</time></li>)}</ul></section>}
    <div className="preview-notice mt-4"><strong>Administrator access is verified by the server</strong><p className="small mb-0">Dashboard data is stored in private backend JSON files. This storage is intended for development or deployments running a single backend process.</p></div>
  </section>;
}

function Field({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return <div className="form-check mb-3"><input className="form-check-input" type="checkbox" id={`field-${field.name}`} checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /><label className="form-check-label" htmlFor={`field-${field.name}`}>{field.label}</label></div>;
  }
  const displayValue = field.type === 'list' ? (value || []).join(', ') : value ?? '';
  const common = {
    id: `field-${field.name}`,
    name: field.name,
    value: displayValue,
    required: field.required,
    type: field.type === 'url' || field.type === 'email' ? field.type : 'text',
    onChange: (event) => onChange(field.type === 'list' ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean) : event.target.value),
  };
  return <div className="mb-3"><label className="form-label" htmlFor={common.id}>{field.label}</label>{field.type === 'textarea' || field.type === 'list'
    ? <textarea {...common} className="form-control" rows={field.type === 'textarea' ? 4 : 2} />
    : <input {...common} className="form-control" />}</div>;
}

function ContentManager({ page }) {
  const config = schemas[page];
  const objectConfig = objectSchemas[page];
  const collection = config?.collection || page;
  const { content, error: loadError, loading, refresh } = useContent(collection, { admin: true });
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState({ kind: '', text: '' });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [replyingId, setReplyingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [messageOverrides, setMessageOverrides] = useState({});

  useEffect(() => {
    setEditingId(null);
    setDraft(null);
    setSearch('');
    setNotice({ kind: '', text: '' });
    setReplyingId(null);
    setReplyDraft('');
    setMessageOverrides({});
  }, [page]);

  useEffect(() => {
    if (objectConfig && !loading && !loadError && content && !draft) setDraft({ ...content });
  }, [content, draft, loadError, loading, objectConfig]);

  const items = Array.isArray(content) ? content : [];
  const filtered = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [items, search]);

  if (page === 'messages') {
    const updateMessage = async (item, read) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setNotice({ kind: '', text: '' });
      try {
        const result = await apiService.admin.updateMessage(item.id, read);
        setMessageOverrides((current) => ({ ...current, [item.id]: result.content }));
        notifyContentChanged();
        await refresh().catch(() => {});
        setNotice({ kind: 'success', text: 'Message status updated.' });
      } catch (error) {
        setNotice({ kind: 'error', text: error.message });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };
    const sendReply = async (item) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setNotice({ kind: '', text: '' });
      try {
        const result = await apiService.admin.replyToMessage(item.id, replyDraft);
        setMessageOverrides((current) => ({ ...current, [item.id]: result.content }));
        notifyContentChanged();
        await refresh().catch(() => {});
        setReplyingId(null);
        setReplyDraft('');
        setNotice({ kind: 'success', text: 'Reply saved to the message.' });
      } catch (error) {
        setNotice({ kind: 'error', text: error.message });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };
    const deleteMessage = async (item) => {
      if (busyRef.current || !window.confirm(`Delete the message "${item.subject}"? This cannot be undone.`)) return;
      busyRef.current = true;
      setBusy(true);
      setNotice({ kind: '', text: '' });
      try {
        await apiService.content.removeMessage(item.id);
        notifyContentChanged();
        await refresh().catch(() => {});
        setNotice({ kind: 'success', text: 'Message deleted.' });
      } catch (error) {
        setNotice({ kind: 'error', text: error.message });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    };
    return <section><p className="eyebrow"><span /> Inbox</p><h1 className="h2 serif-title">Contact messages</h1>
      {loadError && <p className="alert alert-warning" role="alert">Could not load contact messages: {loadError}</p>}
      {notice.text && <p className={`alert ${notice.kind === 'error' ? 'alert-warning' : 'alert-success'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
      {loading && <p className="text-secondary" role="status">Loading contact messages…</p>}
      {!loading && !loadError && items.length === 0 && <div className="empty-state mt-4"><i className="bi bi-inbox" aria-hidden="true" /><h2 className="h5">No messages yet</h2><p className="mb-0">Messages submitted through the portfolio contact form will appear here.</p></div>}
      {!loadError && items.length > 0 && <div className="admin-list mt-4">
        {[...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((record) => {
          const item = messageOverrides[record.id] || record;
          const isReplied = item.status === 'replied' || Boolean(item.reply);
          const isReplying = replyingId === item.id;
          return <article className="admin-list-item" key={item.id}>
            <div className="flex-grow-1">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <h2 className="h5 mb-0">{item.subject}</h2>
                <span className={`badge ${isReplied ? 'text-bg-success' : item.read ? 'text-bg-secondary' : 'text-bg-primary'}`}>
                  {isReplied ? 'Replied' : item.read ? 'Read' : 'Unread'}
                </span>
              </div>
              <p className="small text-secondary mb-2 mt-2">{item.name} · <a href={`mailto:${item.email}`}>{item.email}</a> · <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></p>
              <p className="mb-0 text-break">{item.message}</p>
              {item.reply && <div className="alert alert-light border mt-3 mb-0">
                <strong>Your reply</strong>
                <p className="mb-1 mt-2 text-break">{item.reply}</p>
                {item.repliedAt && <small className="text-secondary"><time dateTime={item.repliedAt}>{new Date(item.repliedAt).toLocaleString()}</time></small>}
              </div>}
              {isReplying && <form className="mt-3" onSubmit={(event) => { event.preventDefault(); sendReply(item); }}>
                <label className="form-label" htmlFor={`reply-${item.id}`}>Reply</label>
                <textarea
                  className="form-control"
                  id={`reply-${item.id}`}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  maxLength={5000}
                  required
                  rows={4}
                  disabled={busy}
                />
                <div className="d-flex gap-2 mt-2">
                  <button className="btn btn-sm btn-primary" type="submit" disabled={busy || !replyDraft.trim()}>
                    {busy ? 'Sending…' : 'Send Reply'}
                  </button>
                  <button className="btn btn-sm btn-outline-secondary" type="button" disabled={busy} onClick={() => { setReplyingId(null); setReplyDraft(''); }}>
                    Cancel
                  </button>
                </div>
              </form>}
            </div>
            <div className="d-flex flex-wrap gap-2 align-self-start">
              <button
                className="btn btn-sm btn-outline-primary"
                type="button"
                disabled={busy}
                onClick={() => { setReplyingId(isReplying ? null : item.id); setReplyDraft(''); }}
              >
                {isReplying ? 'Cancel reply' : 'Reply'}
              </button>
              <button className="btn btn-sm btn-outline-dark" type="button" disabled={busy} onClick={() => updateMessage(item, !item.read)}>{item.read ? 'Mark unread' : 'Mark read'}</button>
              <button className="btn btn-sm btn-outline-danger" type="button" disabled={busy} onClick={() => deleteMessage(item)}>Delete</button>
            </div>
          </article>;
        })}
      </div>}
    </section>;
  }

  if (!config && !objectConfig) return <AdminOverview />;

  const title = config?.title || objectConfig.title;
  const fields = config?.fields || objectConfig.fields;
  const isObject = Boolean(objectConfig);

  const startEdit = (record, id) => {
    setEditingId(id);
    setDraft({ ...record });
    setNotice({ kind: '', text: '' });
  };

  const startCreate = () => {
    setEditingId('__new__');
    setDraft({ ...newRecord(fields), ...(page === 'projects' ? { status: 'Concept', comingSoon: true } : {}) });
    setNotice({ kind: '', text: '' });
  };

  const runMutation = async (operation, successMessage) => {
    if (busyRef.current || loading || loadError) return false;
    busyRef.current = true;
    setBusy(true);
    setNotice({ kind: '', text: '' });
    try {
      await operation();
      notifyContentChanged();
      await refresh().catch(() => {});
      setNotice({ kind: 'success', text: successMessage });
      return true;
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!draft) return;
    const payload = Object.fromEntries(fields.map(({ name }) => [name, draft[name]]));
    const saved = await runMutation(
      () => (isObject
        ? apiService.content.updateSingleton(collection, payload)
        : editingId === '__new__'
          ? apiService.content.create(collection, payload)
          : apiService.content.update(collection, editingId, payload)),
      `${title} saved successfully.`,
    );
    if (saved) {
      setEditingId(null);
      setDraft(null);
    }
  };

  const changeVisibility = (item) => {
    const fieldName = page === 'social-links' ? 'enabled' : 'published';
    const fieldsPayload = Object.fromEntries(fields.map(({ name }) => [name, item[name]]));
    fieldsPayload[fieldName] = item[fieldName] === false;
    return runMutation(
      () => apiService.content.update(collection, item.id, fieldsPayload),
      `${item.title || item.name || item.platform} visibility updated.`,
    );
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name || item.platform}"? This cannot be undone.`)) return;
    await runMutation(
      () => apiService.content.remove(collection, item.id),
      'The content item was deleted.',
    );
  };

  const updateDraft = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  return <section>
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4"><div><p className="eyebrow"><span /> Content management</p><h1 className="h2 serif-title mb-1">{title}</h1><p className="text-secondary mb-0">Changes are saved to the backend and used by the public portfolio when published.</p></div>
      {!isObject && <button className="btn btn-primary" type="button" onClick={startCreate} disabled={loading || Boolean(loadError) || busy}><i className="bi bi-plus-lg me-2" aria-hidden="true" />Add {singular(title).toLowerCase()}</button>}
    </div>
    {loadError && <p className="alert alert-warning" role="alert">Could not load backend content: {loadError}</p>}
    {notice.text && <p className={`alert ${notice.kind === 'error' ? 'alert-warning' : 'alert-success'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
    {loading && <p className="text-secondary" role="status">Loading {title.toLowerCase()}…</p>}
    {draft && !isObject && !loadError && <form className="admin-editor mb-4" onSubmit={save}><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h5 mb-0">{editingId === '__new__' ? `Add ${singular(title).toLowerCase()}` : `Edit ${singular(title).toLowerCase()}`}</h2><button className="btn-close" type="button" aria-label="Cancel editing" disabled={busy} onClick={() => { setDraft(null); setEditingId(null); }} /></div>
      {fields.map((field) => <Field key={field.name} field={field} value={draft[field.name]} onChange={(value) => updateDraft(field.name, value)} />)}
      <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button> <button className="btn btn-outline-secondary" type="button" disabled={busy} onClick={() => { setDraft(null); setEditingId(null); }}>Cancel</button>
    </form>}
    {!isObject && <div className="mb-3"><label className="visually-hidden" htmlFor="admin-search">Search {title.toLowerCase()}</label><div className="input-group"><span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span><input id="admin-search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></div></div>}
    {isObject
      ? !loading && !loadError && <form className="admin-editor" onSubmit={save}>{fields.map((field) => <Field key={field.name} field={field} value={draft?.[field.name] ?? content?.[field.name]} onChange={(value) => updateDraft(field.name, value)} />)}<button className="btn btn-primary" type="submit" disabled={!draft || busy}>{busy ? 'Saving…' : `Save ${title.toLowerCase()}`}</button></form>
      : !loading && !loadError && (filtered.length === 0
        ? <div className="empty-state"><i className="bi bi-inbox" aria-hidden="true" /><h2 className="h5">{items.length ? 'No matching items' : `No ${title.toLowerCase()} yet`}</h2><p className="mb-0">{items.length ? 'Try another search.' : `Create a ${singular(title).toLowerCase()} to get started.`}</p></div>
        : <div className="admin-list">{filtered.map((item) => {
          const visibilityField = page === 'social-links' ? 'enabled' : 'published';
          const isHidden = item[visibilityField] === false;
          return <article className="admin-list-item" key={item.id}><div className="flex-grow-1"><div className="d-flex flex-wrap align-items-center gap-2"><h2 className="h5 mb-0">{item.title || item.name || item.platform || item.id}</h2>{isHidden && <span className="badge text-bg-secondary">{page === 'social-links' ? 'Disabled' : 'Unpublished'}</span>}{page === 'social-links' && !safeExternalUrl(item.url) && <span className="badge text-bg-light">URL not configured</span>}</div><p className="small text-secondary mb-0 mt-2">{item.description || (item.skills || item.technologies || []).join(', ') || item.url || 'No description provided.'}</p></div><div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-dark" type="button" disabled={busy} onClick={() => startEdit(item, item.id)}>Edit</button><button className="btn btn-sm btn-outline-secondary" type="button" disabled={busy} onClick={() => changeVisibility(item)}>{isHidden ? (page === 'social-links' ? 'Enable' : 'Publish') : (page === 'social-links' ? 'Disable' : 'Unpublish')}</button><button className="btn btn-sm btn-outline-danger" type="button" disabled={busy} onClick={() => remove(item)}>Delete</button></div></article>;
        })}</div>)}
    <p className="small text-secondary mt-4 mb-0"><i className="bi bi-info-circle me-1" aria-hidden="true" />This JSON-file-backed editor is for local development and a single backend process; it is not a hardened production database.</p>
  </section>;
}

export default function AdminDashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const page = searchParams.get('section') || 'overview';
  const knownPage = ['overview', ...Object.keys(schemas), ...Object.keys(objectSchemas), 'messages'].includes(page);
  const [logoutError, setLogoutError] = useState('');
  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    }
  };

  return <div className="admin-page">
    <header className="admin-topbar"><Link to="/" className="admin-brand"><span className="brand-mark">LW</span><span>Linet Wairimu <small>Administrator</small></span></Link><div className="d-flex align-items-center gap-2"><span className="preview-pill"><i className="bi bi-person-check me-1" aria-hidden="true" />{user?.name || 'Signed in'}</span><button className="btn btn-sm btn-outline-light" type="button" onClick={handleLogout}>Sign out</button></div></header>
    <div className="admin-shell">
      <nav className="admin-sidebar" aria-label="Admin navigation">{navigation.map(([label, section, icon]) => <Link key={section} className={page === section ? 'active' : ''} to={adminUrl(section)}><i className={`bi ${icon}`} aria-hidden="true" /><span>{label}</span></Link>)}</nav>
      <main className="admin-content">
        {logoutError && <p className="alert alert-warning" role="alert">{logoutError}</p>}
        {page === 'overview' ? <AdminOverview /> : knownPage ? <ContentManager key={page} page={page} /> : <section><h1 className="h2">Page not found</h1><Link to={adminUrl('overview')}>Return to overview</Link></section>}
      </main>
    </div>
  </div>;
}
