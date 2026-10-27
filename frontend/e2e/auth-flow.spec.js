import { expect, test } from '@playwright/test';

test('registration opens the dashboard and profile sign-out returns to login', async ({ page }) => {
  let authenticated = false;
  const user = {
    id: 'e2e-user',
    name: 'Linet Wairimu',
    firstName: 'Linet',
    lastName: 'Wairimu',
    email: 'linet.wairimu@example.com',
    role: 'user',
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: '2026-01-01T00:00:00.000Z',
    preferences: { email: false, sms: false, push: false, region: '', timezone: 'UTC' },
    integrations: [],
    sessionStartedAt: '2026-01-01T00:00:00.000Z',
  };

  await page.route('**/api/auth/csrf', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ csrfToken: 'playwright-test-token' }),
  }));
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: authenticated ? user : null, csrfToken: authenticated ? 'playwright-test-token' : undefined }),
  }));
  await page.route('**/api/auth/register', async (route) => {
    authenticated = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ user, csrfToken: 'playwright-test-token' }) });
  });
  await page.route('**/api/auth/login', async (route) => {
    authenticated = true;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user, csrfToken: 'playwright-test-token' }) });
  });
  await page.route('**/api/auth/logout', (route) => {
    authenticated = false;
    return route.fulfill({ status: 204 });
  });

  await page.goto('/register');
  await expect(page.getByRole('heading', { name: 'Register a New Account.' })).toBeVisible();
  await expect(page.getByText('Your space, your way')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'A clearer view of what’s ahead.' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'User Profile Preview' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'User Preferences' })).toHaveCount(0);
  await page.getByLabel('First Name').fill('Linet');
  await page.getByLabel('Last Name').fill('Wairimu');
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
  await page.getByLabel('Confirm Password').fill('SecurePassword123!');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page).toHaveURL(/\/account\/?$/);
  await expect(page.getByRole('heading', { name: 'Account dashboard' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();

  await page.getByRole('button', { name: 'Sign Out' }).click();

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();

  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password').fill('SecurePassword123!');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/account\/?$/);
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
});

test('registration reports API failure without showing a prototype success', async ({ page }) => {
  await page.route('**/api/auth/me', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ user: null }),
  }));
  await page.route('**/api/auth/csrf', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ csrfToken: 'playwright-test-token' }),
  }));
  await page.route('**/api/auth/register', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ error: { message: 'Registration service unavailable.' } }),
  }));

  await page.goto('/register');
  await page.getByLabel('First Name').fill('Linet');
  await page.getByLabel('Last Name').fill('Wairimu');
  await page.getByLabel('Email address').fill('linet.wairimu@example.com');
  await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
  await page.getByLabel('Confirm Password').fill('SecurePassword123!');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('alert')).toHaveText('Registration service unavailable.');
  await expect(page).toHaveURL(/\/register\/?$/);
  await expect(page.getByText(/Prototype Mode/)).toHaveCount(0);
});