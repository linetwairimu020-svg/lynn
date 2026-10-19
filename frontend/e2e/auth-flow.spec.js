import { expect, test } from '@playwright/test';

test('registration opens the dashboard and profile sign-out returns to login', async ({ page }) => {
  let authenticated = false;
  const user = {
    id: 'e2e-user',
    name: 'Linet Wairimu',
    email: 'linet.wairimu@example.com',
    role: 'user',
  };

  await page.route('**/api/auth/csrf', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ csrfToken: 'playwright-test-token' }),
  }));
  await page.route('**/api/auth/me', (route) => authenticated
    ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user, csrfToken: 'playwright-test-token' }) })
    : route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Sign in required.' } }) }));
  await page.route('**/api/auth/register', async (route) => {
    authenticated = true;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ user }) });
  });
  await page.route('**/api/auth/logout', (route) => {
    authenticated = false;
    return route.fulfill({ status: 204 });
  });

  await page.goto('/register');
  await page.getByLabel('First Name').fill('Linet');
  await page.getByLabel('Last Name').fill('Wairimu');
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
  await page.getByLabel('Confirm Password').fill('SecurePassword123!');
  await page.getByRole('button', { name: 'Register' }).click();

  await expect(page.getByRole('heading', { name: 'Welcome, Linet Wairimu.' })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/?$/);
  await expect(page.getByRole('heading', { name: /welcome, linet/i })).toBeVisible();

  await page.getByRole('button', { name: /profile/i }).click();
  await page.getByRole('button', { name: /sign out|log out/i }).click();

  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
});