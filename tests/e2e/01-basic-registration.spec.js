import { test } from '@playwright/test';
import {
  createUniqueId,
  waitForLoadingToFinish,
  waitForRoute,
  waitForDashboardReady,
  dismissMessageIfVisible,
} from './helpers.js';

test.describe('Basic Registration Flow', () => {
  test('should register a new user successfully', async ({ page }) => {
    const id = createUniqueId();
    const name = `Test User ${id}`;
    const email = `test${id}@example.com`;

    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('textarea[name="wishList"]', 'Books and coffee');

    const registrationResponse = page.waitForResponse((response) =>
      response.url().includes('/api/users') && response.request().method() === 'POST'
    );
    const autoLoginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.locator('button[type="submit"]:has-text("Create Account")').click();
    await registrationResponse;
    await autoLoginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
    await dismissMessageIfVisible(page);
  });
});
