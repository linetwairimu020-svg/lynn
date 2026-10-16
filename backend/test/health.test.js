import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'node:http';

let server;
let baseUrl;
let app;

before(async () => {
  process.env.NODE_ENV = 'test';
  ({ default: app } = await import('../src/app.js'));
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('GET /api/health returns API status', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'lynn-portfolio-api',
  });
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.ok(response.headers.get('x-content-type-options'));
});

test('health endpoint rejects unsupported query parameters', async () => {
  const response = await fetch(`${baseUrl}/api/health?debug=true`);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'INVALID_QUERY',
      message: 'The health endpoint does not accept query parameters.',
    },
  });
});

test('unknown API paths return a JSON not-found response', async () => {
  const response = await fetch(`${baseUrl}/api/not-implemented`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'NOT_FOUND',
      message: 'No route found for GET /api/not-implemented.',
    },
  });
});

test('CORS permits configured development origins', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('CORS rejects unconfigured origins', async () => {
  const response = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'ORIGIN_NOT_ALLOWED',
      message: 'This origin is not allowed.',
    },
  });
});

test('login rejects a state-changing request without a valid CSRF token', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'not-a-real-password' }),
  });
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    error: {
      code: 'CSRF_INVALID',
      message: 'The request could not be verified. Refresh the page and try again.',
    },
  });
});
