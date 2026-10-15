import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useContent from '../hooks/useContent';
import useAuth from '../hooks/useAuth';
import { logout } from '../services/authService';
import { getCollection, saveCollection } from '../services/mockContentService';
import { safeExternalUrl } from '../utils/urls';

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
      { name: 'id', label: 'Platform identifier', required: true },
      { name: 'name', label: 'Displayed profile name', required: true },
      { name: 'url', label: 'Confirmed profile URL (leave blank until supplied)', type: 'url' },
      { name: 'icon', label: 'Bootstrap Icon class', required: true },
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
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function newRecord(fields) {
  return fields.reduce((record, field) => {
    record[field.name] = field.type === 'checkbox' ? false : field.type === 'list' ? [] : '';
    return record;
  }, {});
}

function AdminOverview() {
  const [counts, setCounts] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    try {
      setCounts({
        projects: getCollection('projects').length,
        services: getCollection('services').length,
        skills: getCollection('skills').length,
        messages: getCollection('messages').length,
      });
    } catch (readError) {
      setError(readError.message);
    }
  }, []);
  return <section><p className="eyebrow"><span /> Admin preview</p><h1 className="h2 serif-title">Content overview</h1><p className="text-secondary">Edit preview content here. Changes are saved only in this browser and are not published to a server.</p>
    {error && <p className="alert alert-warning" role="alert">{error}</p>}
    <div className="row g-3 mt-2">{navigation.slice(1, 5).map(([label, section, icon]) => <div className="col-sm-6 col-xl-3" key={section}><Link className="admin-summary-card" to={adminUrl(section)}><i className={`bi ${icon}`} aria-hidden="true" /><span>{label}</span><strong>{counts?.[label.toLowerCase()] ?? '—'}</strong></Link></div>)}<div className="col-sm-6 col-xl-3"><Link className="admin-summary-card" to={adminUrl('messages')}><i className="bi bi-envelope" aria-hidden="true" /><span>Messages</span><strong>{counts?.messages ?? '—'}</strong></Link></div></div>
    <div className="preview-notice mt-4"><strong>Server-verified administrator access</strong><p className="small mb-0">Your account and role are verified by the backend. Dashboard content edits are still saved only in this browser and are not published or shared.</p></div>
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
  const { content, error: loadError } = useContent(collection);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [notice, setNotice] = useState({ kind: '', text: '' });

  useEffect(() => {
    setEditingId(null);
    setDraft(null);
    setSearch('');
    setNotice({ kind: '', text: '' });
  }, [page]);

  useEffect(() => {
    if (objectConfig && content && !draft) setDraft({ ...content });
  }, [content, draft, objectConfig]);

  const items = Array.isArray(content) ? content : [];
  const filtered = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [items, search]);

  if (page === 'messages') {
    return <section><p className="eyebrow"><span /> Inbox</p><h1 className="h2 serif-title">Contact messages</h1>{loadError && <p className="alert alert-warning" role="alert">{loadError}</p>}<div className="empty-state mt-4"><i className="bi bi-inbox" aria-hidden="true" /><h2 className="h5">No messages stored</h2><p className="mb-0">The contact form has no connected backend yet. Messages are not being saved or received by this dashboard.</p></div></section>;
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

  const save = (event) => {
    event.preventDefault();
    try {
      if (isObject) {
        saveCollection(collection, draft);
      } else {
        const generatedId = draft.id || slugify(draft.title || draft.name || `${page}-${Date.now()}`);
        const value = { ...draft, id: generatedId };
        const next = editingId === '__new__'
          ? [...items, value]
          : items.map((item) => (item.id === editingId ? value : item));
        saveCollection(collection, next);
      }
      setEditingId(null);
      setDraft(null);
      setNotice({ kind: 'success', text: `${title} saved to this browser's preview storage.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    }
  };

  const changePublished = (item) => {
    try {
      saveCollection(collection, items.map((entry) => entry.id === item.id ? { ...entry, published: entry.published === false } : entry));
      setNotice({ kind: 'success', text: `${item.title || item.name} publication state updated in this browser.` });
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    }
  };

  const remove = (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}" from this browser's preview content?`)) return;
    try {
      saveCollection(collection, items.filter((entry) => entry.id !== item.id));
      setNotice({ kind: 'success', text: 'The preview item was deleted from this browser.' });
    } catch (error) {
      setNotice({ kind: 'error', text: error.message });
    }
  };

  const updateDraft = (name, value) => setDraft((current) => ({ ...current, [name]: value }));

  return <section>
    <div className="d-flex flex-wrap align-items-end justify-content-between gap-3 mb-4"><div><p className="eyebrow"><span /> Content management</p><h1 className="h2 serif-title mb-1">{title}</h1><p className="text-secondary mb-0">Mock content is stored in this browser only.</p></div>
      {!isObject && page !== 'messages' && <button className="btn btn-primary" type="button" onClick={startCreate}><i className="bi bi-plus-lg me-2" aria-hidden="true" />Add {singular(title).toLowerCase()}</button>}
    </div>
    {loadError && <p className="alert alert-warning" role="alert">Could not load saved preview data: {loadError}</p>}
    {notice.text && <p className={`alert ${notice.kind === 'error' ? 'alert-warning' : 'alert-success'}`} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
    {draft && <form className="admin-editor mb-4" onSubmit={save}><div className="d-flex justify-content-between align-items-center mb-3"><h2 className="h5 mb-0">{editingId === '__new__' ? `Add ${singular(title).toLowerCase()}` : `Edit ${singular(title).toLowerCase()}`}</h2><button className="btn-close" type="button" aria-label="Cancel editing" onClick={() => { setDraft(null); setEditingId(null); }} /></div>
      {fields.map((field) => <Field key={field.name} field={field} value={draft[field.name]} onChange={(value) => updateDraft(field.name, value)} />)}
      <button className="btn btn-primary" type="submit">Save preview content</button> <button className="btn btn-outline-secondary" type="button" onClick={() => { setDraft(null); setEditingId(null); }}>Cancel</button>
    </form>}
    {!isObject && <div className="mb-3"><label className="visually-hidden" htmlFor="admin-search">Search {title.toLowerCase()}</label><div className="input-group"><span className="input-group-text"><i className="bi bi-search" aria-hidden="true" /></span><input id="admin-search" className="form-control" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}`} /></div></div>}
    {isObject
      ? <form className="admin-editor" onSubmit={save}>{fields.map((field) => <Field key={field.name} field={field} value={draft?.[field.name] ?? content?.[field.name]} onChange={(value) => updateDraft(field.name, value)} />)}<button className="btn btn-primary" type="submit" disabled={!draft}>Save {title.toLowerCase()}</button></form>
      : filtered.length === 0
        ? <div className="empty-state"><i className="bi bi-inbox" aria-hidden="true" /><h2 className="h5">{items.length ? 'No matching items' : `No ${title.toLowerCase()} yet`}</h2><p className="mb-0">{items.length ? 'Try another search.' : 'Create a preview item to get started. It will only be saved in this browser.'}</p></div>
        : <div className="admin-list">{filtered.map((item) => <article className="admin-list-item" key={item.id}><div className="flex-grow-1"><div className="d-flex flex-wrap align-items-center gap-2"><h2 className="h5 mb-0">{item.title || item.name || item.id}</h2>{item.published === false && <span className="badge text-bg-secondary">Unpublished</span>}{page === 'social-links' && !safeExternalUrl(item.url) && <span className="badge text-bg-light">URL not configured</span>}</div><p className="small text-secondary mb-0 mt-2">{item.description || (item.skills || item.technologies || []).join(', ') || item.url || 'No description provided.'}</p></div><div className="d-flex flex-wrap gap-2"><button className="btn btn-sm btn-outline-dark" type="button" onClick={() => startEdit(item, item.id)}>Edit</button>{'published' in item && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => changePublished(item)}>{item.published === false ? 'Publish' : 'Unpublish'}</button>}<button className="btn btn-sm btn-outline-danger" type="button" onClick={() => remove(item)}>Delete</button></div></article>)}</div>}
    <p className="small text-secondary mt-4 mb-0"><i className="bi bi-info-circle me-1" aria-hidden="true" />This preview uses browser storage. It is not a persistent database, multi-user system, or production publishing workflow.</p>
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
