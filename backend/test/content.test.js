import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';

process.env.NODE_ENV = 'test';

const frontendOrigin = 'http://localhost:5173';
let dataDir;
let app;
let server;
let baseUrl;
let userStore;
let contentStore;
let adminJar;
let ordinaryJar;

async function startServer() {
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stopServer() {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function updateCookies(jar, response) {
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';', 1)[0];
    const separator = pair.indexOf('=');
    if (separator < 0) continue;
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (/Max-Age=0/i.test(cookie)) jar.delete(name);
    else jar.set(name, value);
  }
}

async function request(pathname, jar = new Map(), options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Origin', frontendOrigin);
  if (jar.size) headers.set('Cookie', [...jar].map(([name, value]) => `${name}=${value}`).join('; '));
  const response = await fetch(`${baseUrl}${pathname}`, { ...options, headers });
  updateCookies(jar, response);
  const body = response.status === 204 ? null : await response.json();
  return { response, body, jar };
}

async function csrf(jar) {
  return request('/api/auth/csrf', jar);
}

async function postWithCsrf(pathname, payload, jar) {
  if (!jar.has('lynn.csrf')) await csrf(jar);
  return request(pathname, jar, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': decodeURIComponent(jar.get('lynn.csrf')),
    },
    body: JSON.stringify(payload),
  });
}

async function mutateWithCsrf(pathname, method, payload, jar) {
  if (!jar.has('lynn.csrf')) await csrf(jar);
  return request(pathname, jar, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': decodeURIComponent(jar.get('lynn.csrf')),
    },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
}

before(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'lynn-content-tests-'));
  process.env.DATA_DIR = dataDir;
  ({ default: app } = await import('../src/app.js'));
  userStore = await import('../src/services/userStore.js');
  contentStore = await import('../src/services/contentStore.js');
  await Promise.all([
    userStore.initializeUserStore(),
    (await import('../src/services/sessionStore.js')).initializeSessionStore(),
    contentStore.initializeContentStore(),
  ]);
  await startServer();

  const adminPassword = 'ContentAdminPassword321';
  const admin = await userStore.createUser({
    name: 'Content Admin',
    email: 'content-admin@example.com',
    passwordHash: await (await import('argon2')).default.hash(adminPassword, { type: 2 }),
  });
  await userStore.provisionAdmin({ email: admin.email });
  adminJar = new Map();
  await postWithCsrf('/api/auth/login', { email: admin.email, password: adminPassword }, adminJar);

  await userStore.createUser({
    name: 'Ordinary User',
    email: 'ordinary@example.com',
    passwordHash: await (await import('argon2')).default.hash('StrongUserPassword321', { type: 2 }),
  });
  ordinaryJar = new Map();
  await postWithCsrf('/api/auth/login', { email: 'ordinary@example.com', password: 'StrongUserPassword321' }, ordinaryJar);
});

after(async () => {
  await stopServer();
  await rm(dataDir, { recursive: true, force: true });
});

test('Admin Dashboard data endpoints return backend content only to administrators', async () => {
  const paths = [
    '/api/admin/overview',
    '/api/admin/profile',
    '/api/admin/projects',
    '/api/admin/services',
    '/api/admin/skills',
    '/api/admin/social-links',
    '/api/admin/settings',
    '/api/admin/messages',
  ];

  for (const pathname of paths) {
    const [adminResult, anonymousResult, ordinaryResult] = await Promise.all([
      request(pathname, adminJar),
      request(pathname),
      request(pathname, ordinaryJar),
    ]);
    assert.equal(adminResult.response.status, 200, `${pathname} should load for an administrator`);
    assert.equal(anonymousResult.response.status, 401, `${pathname} should reject anonymous access`);
    assert.equal(ordinaryResult.response.status, 403, `${pathname} should reject ordinary users`);
    if (pathname !== '/api/admin/overview') {
      assert.ok(Object.hasOwn(adminResult.body, 'content'), `${pathname} should return its content payload`);
    }
  }
});

test('admin CRUD is protected, validates fields, and published content is public', async () => {
  const initializedFiles = ['projects.json', 'services.json', 'skills.json', 'profile.json', 'social-links.json', 'settings.json', 'messages.json'];
  for (const fileName of initializedFiles) {
    assert.ok((await readFile(path.join(dataDir, fileName), 'utf8')).length > 0);
  }
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, 'messages.json'), 'utf8')), []);
  const freshOverview = await request('/api/admin/overview', adminJar);
  assert.equal(freshOverview.response.status, 200);
  assert.deepEqual(freshOverview.body.recentActivity, []);

  assert.equal((await request('/api/admin/projects')).response.status, 401);
  assert.equal((await request('/api/admin/projects', ordinaryJar)).response.status, 403);

  const publicBefore = await request('/api/content/projects');
  assert.equal(publicBefore.response.status, 200);
  assert.ok(publicBefore.body.content.length > 0);

  const invalid = await postWithCsrf('/api/admin/projects', { title: 'Invalid', description: 'missing status' }, adminJar);
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, 'INVALID_CONTENT');
  const roleInput = await postWithCsrf('/api/admin/projects', {
    title: 'Invalid role field',
    status: 'Test',
    description: 'Role assignment is not an editable content field.',
    role: 'admin',
  }, adminJar);
  assert.equal(roleInput.response.status, 400);

  const created = await postWithCsrf('/api/admin/projects', {
    title: 'JSON persistence test',
    number: '99',
    status: 'In progress',
    description: 'Created through the admin API.',
    image: '',
    technologies: ['React'],
    route: '',
    demoUrl: '',
    repositoryUrl: '',
    comingSoon: false,
    published: true,
  }, adminJar);
  assert.equal(created.response.status, 201);
  const id = created.body.content.id;
  assert.ok(id);

  const updated = await mutateWithCsrf(`/api/admin/projects/${id}`, 'PUT', {
    title: 'JSON persistence test',
    number: '99',
    status: 'In progress',
    description: 'Now unpublished.',
    image: '',
    technologies: ['React'],
    route: '',
    demoUrl: '',
    repositoryUrl: '',
    comingSoon: false,
    published: false,
  }, adminJar);
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.content.published, false);
  const publicAfterUnpublish = await request('/api/content/projects');
  assert.equal(publicAfterUnpublish.body.content.some((item) => item.id === id), false);

  const publish = await mutateWithCsrf(`/api/admin/projects/${id}`, 'PUT', {
    title: 'JSON persistence test',
    number: '99',
    status: 'In progress',
    description: 'Published again.',
    image: '',
    technologies: ['React'],
    route: '',
    demoUrl: '',
    repositoryUrl: '',
    comingSoon: false,
    published: true,
  }, adminJar);
  assert.equal(publish.response.status, 200);
  assert.ok((await request('/api/content/projects')).body.content.some((item) => item.id === id));

  const missing = await mutateWithCsrf('/api/admin/projects/missing-record', 'PUT', {
    title: 'Missing', status: 'Done', description: 'No record',
  }, adminJar);
  assert.equal(missing.response.status, 404);

  const deleted = await mutateWithCsrf(`/api/admin/projects/${id}`, 'DELETE', undefined, adminJar);
  assert.equal(deleted.response.status, 204);
  const deleteMissing = await mutateWithCsrf(`/api/admin/projects/${id}`, 'DELETE', undefined, adminJar);
  assert.equal(deleteMissing.response.status, 404);
});

test('protected singleton and social-link APIs persist settings and visibility', async () => {
  const anonymous = await request('/api/admin/profile');
  assert.equal(anonymous.response.status, 401);

  const profile = await mutateWithCsrf('/api/admin/profile', 'PUT', {
    name: 'Updated Lynn Profile',
    headline: 'Developer & designer',
    summary: 'A saved summary.',
    about: 'A saved about paragraph.',
    location: 'Kenya',
    email: 'owner@example.com',
    phone: '',
  }, adminJar);
  assert.equal(profile.response.status, 200);
  assert.equal((await request('/api/content/profile')).body.content.name, 'Updated Lynn Profile');

  const settings = await mutateWithCsrf('/api/admin/settings', 'PUT', {
    siteTitle: 'Updated Lynn Portfolio',
    notice: 'Saved through the API.',
  }, adminJar);
  assert.equal(settings.response.status, 200);
  assert.equal((await request('/api/content/settings')).body.content.siteTitle, 'Updated Lynn Portfolio');

  const created = await postWithCsrf('/api/admin/social-links', {
    platform: 'example-social',
    name: 'Example',
    url: 'https://example.com/profile',
    icon: 'bi-globe',
    enabled: true,
  }, adminJar);
  assert.equal(created.response.status, 201);
  const id = created.body.content.id;
  assert.ok((await request('/api/content/social-links')).body.content.some((item) => item.id === id));

  const disabled = await mutateWithCsrf(`/api/admin/social-links/${id}`, 'PUT', {
    platform: 'example-social',
    name: 'Example',
    url: 'https://example.com/profile',
    icon: 'bi-globe',
    enabled: false,
  }, adminJar);
  assert.equal(disabled.response.status, 200);
  assert.equal((await request('/api/content/social-links')).body.content.some((item) => item.id === id), false);
  assert.equal((await mutateWithCsrf(`/api/admin/social-links/${id}`, 'DELETE', undefined, adminJar)).response.status, 204);

  const service = await postWithCsrf('/api/admin/services', {
    title: 'JSON Service',
    icon: 'bi-window',
    description: 'Service CRUD integration test.',
    published: true,
  }, adminJar);
  assert.equal(service.response.status, 201);
  const serviceId = service.body.content.id;
  const serviceUpdate = await mutateWithCsrf(`/api/admin/services/${serviceId}`, 'PUT', {
    title: 'Updated JSON Service',
    icon: 'bi-window',
    description: 'Updated service.',
    published: true,
  }, adminJar);
  assert.equal(serviceUpdate.response.status, 200);
  assert.equal(serviceUpdate.body.content.title, 'Updated JSON Service');
  assert.equal((await mutateWithCsrf(`/api/admin/services/${serviceId}`, 'DELETE', undefined, adminJar)).response.status, 204);

  const skill = await postWithCsrf('/api/admin/skills', {
    name: 'JSON Skills',
    icon: 'bi-code',
    skills: ['Node.js'],
    published: true,
  }, adminJar);
  assert.equal(skill.response.status, 201);
  const skillId = skill.body.content.id;
  const unpublishedSkill = await mutateWithCsrf(`/api/admin/skills/${skillId}`, 'PUT', {
    name: 'JSON Skills',
    icon: 'bi-code',
    skills: ['Node.js'],
    published: false,
  }, adminJar);
  assert.equal(unpublishedSkill.response.status, 200);
  assert.equal((await request('/api/content/skills')).body.content.some((item) => item.id === skillId), false);
  assert.equal((await mutateWithCsrf(`/api/admin/skills/${skillId}`, 'DELETE', undefined, adminJar)).response.status, 204);

  assert.equal((await request('/api/admin/social-links', ordinaryJar)).response.status, 403);
});

test('content initialization adds the WhatsApp social link when it is missing', async () => {
  const linksBefore = await contentStore.listContent('social-links');
  for (const link of linksBefore.filter((item) => item.id === 'whatsapp' || item.platform === 'whatsapp')) {
    await contentStore.deleteContent('social-links', link.id);
  }

  await contentStore.initializeContentStore();

  const links = await contentStore.listContent('social-links');
  assert.equal(links.filter((item) => item.id === 'whatsapp' || item.platform === 'whatsapp').length, 1);
  assert.equal(links.find((item) => item.id === 'whatsapp')?.url, 'https://web.whatsapp.com/#!');
});

test('contact messages validate public submissions and remain admin-only', async () => {
  assert.equal((await request('/api/admin/messages')).response.status, 401);
  assert.equal((await request('/api/admin/messages', ordinaryJar)).response.status, 403);
  assert.equal((await request('/api/content/messages')).response.status, 404);

  const invalid = await postWithCsrf('/api/contact-messages', {
    name: 'Example',
    email: 'bad',
    subject: 'Hello',
    message: 'A message',
  }, new Map());
  assert.equal(invalid.response.status, 400);

  const submission = await postWithCsrf('/api/contact-messages', {
    name: 'Example Person',
    email: 'Example@EXAMPLE.com',
    subject: 'A real inquiry',
    message: 'Please contact me.',
  }, new Map());
  assert.equal(submission.response.status, 201);
  assert.equal(submission.body.message, 'Your message was received.');
  assert.equal(JSON.stringify(submission.body).includes('Please contact me'), false);

  const inbox = await request('/api/admin/messages', adminJar);
  const message = inbox.body.content.find((entry) => entry.id === submission.body.id);
  assert.equal(message.email, 'example@example.com');
  assert.equal(message.read, false);

  const markedRead = await mutateWithCsrf(`/api/admin/messages/${message.id}`, 'PATCH', { read: true }, adminJar);
  assert.equal(markedRead.response.status, 200);
  assert.equal(markedRead.body.content.read, true);

  const replyAsOrdinaryUser = await postWithCsrf(
    `/api/admin/messages/${message.id}/reply`,
    { reply: 'This should be forbidden.' },
    ordinaryJar,
  );
  assert.equal(replyAsOrdinaryUser.response.status, 403);

  const invalidReply = await postWithCsrf(
    `/api/admin/messages/${message.id}/reply`,
    { reply: '   ' },
    adminJar,
  );
  assert.equal(invalidReply.response.status, 400);

  const sentReply = await postWithCsrf(
    `/api/admin/messages/${message.id}/reply`,
    { reply: 'Thank you for reaching out.' },
    adminJar,
  );
  assert.equal(sentReply.response.status, 200);
  assert.equal(sentReply.body.content.reply, 'Thank you for reaching out.');
  assert.equal(sentReply.body.content.status, 'replied');
  assert.equal(sentReply.body.content.read, true);
  assert.ok(Number.isFinite(Date.parse(sentReply.body.content.repliedAt)));

  const markedUnread = await mutateWithCsrf(`/api/admin/messages/${message.id}`, 'PATCH', { read: false }, adminJar);
  assert.equal(markedUnread.response.status, 200);
  assert.equal(markedUnread.body.content.read, false);
  assert.equal(markedUnread.body.content.status, 'replied');

  const deleted = await mutateWithCsrf(`/api/admin/messages/${message.id}`, 'DELETE', undefined, adminJar);
  assert.equal(deleted.response.status, 204);
  const missing = await mutateWithCsrf(`/api/admin/messages/${message.id}`, 'PATCH', { read: false }, adminJar);
  assert.equal(missing.response.status, 404);
  const missingReply = await postWithCsrf(`/api/admin/messages/${message.id}/reply`, { reply: 'No message.' }, adminJar);
  assert.equal(missingReply.response.status, 404);
});

test('concurrent writes retain every created record and content survives server restart', async () => {
  const makeProject = (title) => ({
    title,
    status: 'Test',
    description: 'Concurrent write check.',
    image: '',
    technologies: [],
    route: '',
    demoUrl: '',
    repositoryUrl: '',
    comingSoon: false,
    published: true,
  });
  const created = await Promise.all([
    postWithCsrf('/api/admin/projects', makeProject('Concurrent project one'), adminJar),
    postWithCsrf('/api/admin/projects', makeProject('Concurrent project two'), adminJar),
  ]);
  assert.deepEqual(created.map(({ response }) => response.status), [201, 201]);
  const ids = created.map(({ body }) => body.content.id);
  const beforeRestart = await request('/api/admin/projects', adminJar);
  assert.ok(ids.every((id) => beforeRestart.body.content.some((item) => item.id === id)));

  await stopServer();
  await startServer();
  const afterRestart = await request('/api/admin/projects', adminJar);
  assert.ok(ids.every((id) => afterRestart.body.content.some((item) => item.id === id)));
  const overview = await request('/api/admin/overview', adminJar);
  assert.equal(overview.response.status, 200);
  assert.ok(overview.body.counts.projects >= 3);
  assert.ok(overview.body.recentActivity.length > 0);
});

test('failed JSON reads do not overwrite the existing content file', async () => {
  const projectsPath = path.join(dataDir, 'projects.json');
  const original = await readFile(projectsPath, 'utf8');
  await writeFile(projectsPath, '{broken json', 'utf8');
  try {
    const result = await request('/api/admin/projects', adminJar);
    assert.equal(result.response.status, 500);
    assert.equal(await readFile(projectsPath, 'utf8'), '{broken json');
  } finally {
    await writeFile(projectsPath, original, 'utf8');
  }
});

test('failed atomic writes leave the replacement target untouched', async () => {
  const projectsPath = path.join(dataDir, 'projects.json');
  const original = await readFile(projectsPath, 'utf8');
  try {
    const { withJsonArray } = await import('../src/services/jsonArrayStore.js');
    await assert.rejects(withJsonArray('projects.json', Array.isArray, async (records) => {
      await rm(projectsPath);
      await mkdir(projectsPath);
      return { value: undefined, records, changed: true };
    }), /EISDIR|EPERM|EEXIST|directory/i);
    assert.equal((await stat(projectsPath)).isDirectory(), true);
  } finally {
    await rm(projectsPath, { recursive: true, force: true });
    await writeFile(projectsPath, original, 'utf8');
  }
});
