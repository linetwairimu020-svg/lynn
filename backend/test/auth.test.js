import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';

const frontendOrigin = 'http://localhost:5173';
const execFileAsync = promisify(execFile);
const provisioningScript = fileURLToPath(new URL('../scripts/provision-admin.js', import.meta.url));
let dataDir;
let app;
let server;
let baseUrl;
let userStore;
let sessionStore;
let argon2;

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
  const body = await response.json();
  return { response, body, jar };
}

async function csrf(jar) {
  return request('/api/auth/csrf', jar);
}

async function postWithCsrf(pathname, body, jar) {
  if (!jar.has('lynn.csrf')) await csrf(jar);
  return request(pathname, jar, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': decodeURIComponent(jar.get('lynn.csrf')),
    },
    body: JSON.stringify(body),
  });
}

const newUser = {
  name: 'Test Lynn User',
  email: 'Test.User@example.com',
  password: 'StrongPassword123',
};

before(async () => {
  dataDir = await mkdtemp(path.join(os.tmpdir(), 'lynn-auth-tests-'));
  process.env.DATA_DIR = dataDir;
  ({ default: app } = await import('../src/app.js'));
  userStore = await import('../src/services/userStore.js');
  sessionStore = await import('../src/services/sessionStore.js');
  argon2 = await import('argon2');
  await Promise.all([userStore.initializeUserStore(), sessionStore.initializeSessionStore()]);
  await startServer();
});

after(async () => {
  await stopServer();
  await rm(dataDir, { recursive: true, force: true });
});

test('initializes empty JSON data files without exposing a public data path', async () => {
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, 'users.json'), 'utf8')), []);
  assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, 'sessions.json'), 'utf8')), []);
});

test('registers an ordinary user and returns no credential material', async () => {
  const result = await postWithCsrf('/api/auth/register', { ...newUser, phone: '+1 (555) 123-4567' }, new Map());
  assert.equal(result.response.status, 201);
  assert.deepEqual(Object.keys(result.body.user).sort(), [
    'avatarUrl', 'createdAt', 'email', 'firstName', 'id', 'integrations',
    'lastLoginAt', 'lastName', 'location', 'name', 'preferences', 'role',
  ]);
  assert.equal(result.body.user.email, newUser.email);
  assert.equal(result.body.user.role, 'user');
  assert.equal('phone' in result.body.user, false);
  const stored = JSON.parse(await readFile(path.join(dataDir, 'users.json'), 'utf8'));
  assert.equal(stored.length, 1);
  assert.equal(stored[0].emailNormalized, newUser.email.toLowerCase());
  assert.equal(stored[0].phone, '+1 (555) 123-4567');
  assert.match(stored[0].passwordHash, /^\$argon2id\$/);
  assert.equal(JSON.stringify(stored).includes(newUser.password), false);
});

test('rejects invalid optional phone numbers during registration', async () => {
  const result = await postWithCsrf('/api/auth/register', { ...newUser, email: 'invalid.phone@example.com', phone: 'call me maybe' }, new Map());
  assert.equal(result.response.status, 400);
  assert.equal(result.body.error.code, 'INVALID_PHONE');

  const invalidType = await postWithCsrf('/api/auth/register', { ...newUser, email: 'invalid.phone-type@example.com', phone: 12345678 }, new Map());
  assert.equal(invalidType.response.status, 400);
  assert.equal(invalidType.body.error.code, 'INVALID_PHONE');
});

test('rejects duplicate normalized email addresses', async () => {
  const result = await postWithCsrf('/api/auth/register', { ...newUser, email: ' test.user@EXAMPLE.com ' }, new Map());
  assert.equal(result.response.status, 409);
  assert.equal(result.body.error.code, 'EMAIL_IN_USE');
});

test('serializes concurrent registrations for the same normalized email', async () => {
  const details = { ...newUser, email: 'Concurrent.User@example.com' };
  const results = await Promise.all([
    postWithCsrf('/api/auth/register', details, new Map()),
    postWithCsrf('/api/auth/register', { ...details, email: ' concurrent.user@EXAMPLE.com ' }, new Map()),
  ]);
  assert.deepEqual(results.map(({ response }) => response.status).sort(), [201, 409]);
});

test('rejects invalid registration data and public administrator assignment', async () => {
  const invalid = await postWithCsrf('/api/auth/register', { ...newUser, password: 'weak' }, new Map());
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error.code, 'INVALID_PASSWORD');

  const privilegeEscalation = await postWithCsrf('/api/auth/register', {
    ...newUser,
    email: 'other@example.com',
    role: 'admin',
  }, new Map());
  assert.equal(privilegeEscalation.response.status, 400);
  assert.equal(privilegeEscalation.body.error.code, 'INVALID_REGISTRATION');
});

test('login uses generic invalid-credential responses and issues HTTP-only session cookies', async () => {
  const jar = new Map();
  const invalid = await postWithCsrf('/api/auth/login', { email: newUser.email, password: 'WrongPassword123' }, jar);
  assert.equal(invalid.response.status, 401);
  assert.equal(invalid.body.error.message, 'Email or password is incorrect.');

  const result = await postWithCsrf('/api/auth/login', { email: newUser.email.toUpperCase(), password: newUser.password }, jar);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.user.role, 'user');
  assert.equal(JSON.stringify(result.body).includes('passwordHash'), false);
  assert.ok(jar.has('lynn.sid'));
  assert.ok(jar.has('lynn.csrf'));
  const sessionCookie = result.response.headers.getSetCookie().find((cookie) => cookie.startsWith('lynn.sid='));
  assert.match(sessionCookie, /HttpOnly/i);
  assert.match(sessionCookie, /SameSite=Lax/i);
  assert.match(sessionCookie, /Max-Age=/i);
  assert.equal(result.response.headers.get('access-control-allow-credentials'), 'true');
  return { jar };
});

test('rejects state-changing requests without a matching CSRF token', async () => {
  const result = await request('/api/auth/logout', new Map(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(result.response.status, 403);
  assert.equal(result.body.error.code, 'CSRF_INVALID');
});

test('returns the authenticated user from /me and requires a valid session', async () => {
  const anonymous = await request('/api/auth/me');
  assert.equal(anonymous.response.status, 401);

  const loginJar = new Map();
  await postWithCsrf('/api/auth/login', { email: newUser.email, password: newUser.password }, loginJar);
  const authenticated = await request('/api/auth/me', loginJar);
  assert.equal(authenticated.response.status, 200);
  assert.equal(authenticated.body.user.email, newUser.email);
  assert.ok(authenticated.body.csrfToken);
  assert.equal(JSON.stringify(authenticated.body).includes('passwordHash'), false);
});

test('updates only the authenticated user preferences and validates timezone and field types', async () => {
  const jar = new Map();
  await postWithCsrf('/api/auth/login', { email: newUser.email, password: newUser.password }, jar);
  const headers = {
    'Content-Type': 'application/json',
    'X-CSRF-Token': decodeURIComponent(jar.get('lynn.csrf')),
  };
  const updated = await request('/api/user/preferences', jar, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ email: true, region: 'Kenya', timezone: 'Africa/Nairobi' }),
  });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.user.preferences.email, true);
  assert.equal(updated.body.user.preferences.region, 'Kenya');
  assert.equal(updated.body.user.preferences.timezone, 'Africa/Nairobi');
  assert.equal(updated.body.user.preferences.sms, false);
  assert.ok(updated.body.user.sessionStartedAt);
  assert.equal(JSON.stringify(updated.body).includes('passwordHash'), false);

  const invalidTimezone = await request('/api/user/preferences', jar, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ timezone: 'Not/A_Timezone' }),
  });
  assert.equal(invalidTimezone.response.status, 400);
  const invalidField = await request('/api/user/preferences', jar, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ email: 'yes' }),
  });
  assert.equal(invalidField.response.status, 400);

  const storedUsers = JSON.parse(await readFile(path.join(dataDir, 'users.json'), 'utf8'));
  const storedUser = storedUsers.find((user) => user.emailNormalized === newUser.email.toLowerCase());
  assert.equal(storedUser.preferences.region, 'Kenya');
  assert.ok(storedUser.lastLoginAt);
});

test('denies ordinary users and safely provisions an existing account without changing credentials', async () => {
  const ordinaryJar = new Map();
  await postWithCsrf('/api/auth/login', { email: newUser.email, password: newUser.password }, ordinaryJar);
  const denied = await request('/api/admin/access', ordinaryJar);
  assert.equal(denied.response.status, 403);
  const deniedUnknownAdmin = await request('/api/admin/projects', ordinaryJar);
  assert.equal(deniedUnknownAdmin.response.status, 403);

  const adminPassword = 'SecureAdminPassword987';
  const passwordHash = await argon2.hash(adminPassword, { type: argon2.argon2id });
  const existingAdminAccount = await userStore.createUser({
    name: 'Provisioned Admin',
    email: 'owner@example.com',
    passwordHash,
  });
  const originalAdminAccount = { ...existingAdminAccount };
  const adminJar = new Map();
  await postWithCsrf('/api/auth/login', { email: existingAdminAccount.email, password: adminPassword }, adminJar);
  const beforeProvisioning = await request('/api/auth/me', adminJar);
  assert.equal(beforeProvisioning.response.status, 200);

  const runProvisioning = async (email, confirmedEmail) => {
    try {
      return await execFileAsync(process.execPath, [provisioningScript], {
        cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
        env: { ...process.env, DATA_DIR: dataDir, ADMIN_EMAIL: email, ADMIN_EMAIL_CONFIRM: confirmedEmail },
      });
    } catch (error) {
      throw new Error(error.stderr || error.message);
    }
  };
  await assert.rejects(runProvisioning('owner@example.com', 'other@example.com'), /ADMIN_EMAIL_CONFIRM/);
  await assert.rejects(runProvisioning('missing@example.com', 'missing@example.com'), /No existing account matches/);

  const { stdout } = await runProvisioning(' OWNER@EXAMPLE.COM ', 'owner@example.com');
  assert.match(stdout, /Administrator role verified/);
  const storedUsers = JSON.parse(await readFile(path.join(dataDir, 'users.json'), 'utf8'));
  const promotedUsers = storedUsers.filter((user) => user.emailNormalized === 'owner@example.com');
  assert.equal(promotedUsers.length, 1);
  assert.deepEqual(
    Object.fromEntries(['id', 'name', 'email', 'emailNormalized', 'passwordHash', 'createdAt'].map((key) => [key, promotedUsers[0][key]])),
    Object.fromEntries(['id', 'name', 'email', 'emailNormalized', 'passwordHash', 'createdAt'].map((key) => [key, originalAdminAccount[key]])),
  );
  assert.equal(promotedUsers[0].role, 'admin');
  assert.equal(JSON.stringify(storedUsers).includes(adminPassword), false);

  const revokedSession = await request('/api/auth/me', adminJar);
  assert.equal(revokedSession.response.status, 401);

  const refreshedAdminJar = new Map();
  await postWithCsrf('/api/auth/login', { email: existingAdminAccount.email, password: adminPassword }, refreshedAdminJar);
  const allowed = await request('/api/admin/access', refreshedAdminJar);
  assert.equal(allowed.response.status, 200);
  assert.equal(allowed.body.user.role, 'admin');
  assert.equal(JSON.stringify(allowed.body).includes('passwordHash'), false);
});

test('user and session files preserve a valid login across a backend restart', async () => {
  const jar = new Map();
  await postWithCsrf('/api/auth/login', { email: newUser.email, password: newUser.password }, jar);
  await stopServer();
  await startServer();
  const afterRestart = await request('/api/auth/me', jar);
  assert.equal(afterRestart.response.status, 200);
  assert.equal(afterRestart.body.user.email, newUser.email);
});

test('logout deletes the server session and clears both cookies', async () => {
  const jar = new Map();
  await postWithCsrf('/api/auth/login', { email: newUser.email, password: newUser.password }, jar);
  const result = await postWithCsrf('/api/auth/logout', {}, jar);
  assert.equal(result.response.status, 200);
  assert.equal(result.body.message, 'Signed out.');
  assert.equal(jar.has('lynn.sid'), false);
  assert.equal(jar.has('lynn.csrf'), false);
  const anonymous = await request('/api/auth/me', jar);
  assert.equal(anonymous.response.status, 401);
});

test('refuses to overwrite corrupted user data', async () => {
  const usersPath = path.join(dataDir, 'users.json');
  const validContents = await readFile(usersPath, 'utf8');
  await writeFile(usersPath, '{not json', 'utf8');
  try {
    const loginJar = new Map();
    const token = await csrf(loginJar);
    const loginResult = await request('/api/auth/login', loginJar, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token.body.csrfToken },
      body: JSON.stringify({ email: newUser.email, password: newUser.password }),
    });
    assert.equal(loginResult.response.status, 500);
    assert.equal(await readFile(usersPath, 'utf8'), '{not json');
  } finally {
    await writeFile(usersPath, validContents, 'utf8');
  }
});
