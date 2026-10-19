# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-flow.spec.js >> registration opens the dashboard and profile sign-out returns to login
- Location: e2e\auth-flow.spec.js:3:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/dashboard\/?$/
Received string:  "http://localhost:5173/register"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    13 × locator resolved to <html lang="en">…</html>
       - unexpected value "http://localhost:5173/register"

```

```yaml
- banner:
  - link "Linet Wairimu home":
    - /url: /
    - text: LW
- main:
  - region "Welcome, Linet Wairimu.":
    - paragraph: Interactive Frontend Prototype
    - paragraph: You’re all set
    - heading "Welcome, Linet Wairimu." [level=1]
    - status: Your account has been created. You can now sign in and continue exploring.
    - link "Continue to login":
      - /url: /login
    - link "Explore my projects":
      - /url: /#work
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('registration opens the dashboard and profile sign-out returns to login', async ({ page }) => {
  4  |   let authenticated = false;
  5  |   const user = {
  6  |     id: 'e2e-user',
  7  |     name: 'Linet Wairimu',
  8  |     email: 'linet.wairimu@example.com',
  9  |     role: 'user',
  10 |   };
  11 | 
  12 |   await page.route('**/api/auth/csrf', (route) => route.fulfill({
  13 |     status: 200,
  14 |     contentType: 'application/json',
  15 |     body: JSON.stringify({ csrfToken: 'playwright-test-token' }),
  16 |   }));
  17 |   await page.route('**/api/auth/me', (route) => authenticated
  18 |     ? route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user, csrfToken: 'playwright-test-token' }) })
  19 |     : route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Sign in required.' } }) }));
  20 |   await page.route('**/api/auth/register', async (route) => {
  21 |     authenticated = true;
  22 |     await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ user }) });
  23 |   });
  24 |   await page.route('**/api/auth/logout', (route) => {
  25 |     authenticated = false;
  26 |     return route.fulfill({ status: 204 });
  27 |   });
  28 | 
  29 |   await page.goto('/register');
  30 |   await page.getByLabel('First Name').fill('Linet');
  31 |   await page.getByLabel('Last Name').fill('Wairimu');
  32 |   await page.getByLabel('Email address').fill(user.email);
  33 |   await page.getByLabel('Password', { exact: true }).fill('SecurePassword123!');
  34 |   await page.getByLabel('Confirm Password').fill('SecurePassword123!');
  35 |   await page.getByRole('button', { name: 'Register' }).click();
  36 | 
  37 |   await expect(page.getByRole('heading', { name: 'Welcome, Linet Wairimu.' })).toBeVisible();
> 38 |   await expect(page).toHaveURL(/\/dashboard\/?$/);
     |                      ^ Error: expect(page).toHaveURL(expected) failed
  39 |   await expect(page.getByRole('heading', { name: /welcome, linet/i })).toBeVisible();
  40 | 
  41 |   await page.getByRole('button', { name: /profile/i }).click();
  42 |   await page.getByRole('button', { name: /sign out|log out/i }).click();
  43 | 
  44 |   await expect(page).toHaveURL(/\/login\/?$/);
  45 |   await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible();
  46 | });
```