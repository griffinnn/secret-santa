import { test, expect } from '@playwright/test';
import {
  createUniqueId,
  waitForLoadingToFinish,
  waitForRoute,
  waitForDashboardReady,
  dismissMessageIfVisible,
  performLogout,
} from './helpers.js';

test.describe('Secret Santa Basic User Flows', () => {
  test('should register a new user successfully', async ({ page }) => {
    const id = createUniqueId();
    const name = `Alice Test ${id}`;
    const email = `alice${id}@example.com`;

    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('textarea[name="wishList"]', 'Books, coffee, puzzles');

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
  });

  test('should allow login from home page', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    const loginBtn = page.locator('#auth-button');
    await expect(loginBtn).toBeVisible();

    await dismissMessageIfVisible(page);
    await loginBtn.click();

    await waitForRoute(page, '#/login');
    await expect(page).toHaveURL('/#/login');
  });

  test('should access dashboard after registration and login', async ({ page }) => {
    const id = createUniqueId();
    const name = `User${id}`;
    const email = `user${id}@test.com`;

    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="name"]', name);
    await page.fill('input[name="email"]', email);
    await page.fill('textarea[name="wishList"]', 'Test items');

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

    await performLogout(page);

    await page.goto('/#/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="email"]', email);

    const loginResponse = page.waitForResponse((response) =>
      response.url().includes('/api/auth/login') && response.request().method() === 'POST'
    );
    await page.click('button[type="submit"]:has-text("Login")');
    await loginResponse;
    await waitForRoute(page, '#/dashboard');
    await waitForDashboardReady(page);
  });

  test('should navigate between main routes', async ({ page }) => {
    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL('/#/');

    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL('/#/register');

    await page.goto('/#/');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);
    await expect(page).toHaveURL('/#/');
  });

  test('should show error for invalid registration data', async ({ page }) => {
    await page.goto('/#/register');
    await page.waitForLoadState('domcontentloaded');
    await waitForLoadingToFinish(page);

    await page.fill('input[name="name"]', 'Valid Name');
    await page.fill('input[name="email"]', 'not-an-email');

    await page.locator('button[type="submit"]:has-text("Create Account")').click();

    const messageText = page.locator('#message-container:not(.hidden) #message-text');
    await expect(messageText).toHaveText(/valid email/i, { timeout: 5000 });
    await dismissMessageIfVisible(page);
    await expect(page).toHaveURL('/#/register');
  });
});
